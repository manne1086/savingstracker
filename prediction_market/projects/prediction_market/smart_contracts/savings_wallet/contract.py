"""
SavingsVault - Non-custodial ALGO savings smart contract.

Rewritten to use the current Algorand Python (PuyaPy) storage model:
- GlobalState for contract-level values
- LocalState for per-account values
- gtxn.PaymentTransaction for ABI transaction references
"""

from algopy import (
    ARC4Contract,
    Account,
    Global,
    GlobalState,
    LocalState,
    Txn,
    UInt64,
    arc4,
    gtxn,
    itxn,
    log,
    subroutine,
)

MICRO_ALGO = 1_000_000
ONE_DAY_ROUNDS = 1_440
TWO_DAY_ROUNDS = 2_880


class SavingsVault(ARC4Contract):
    """Non-custodial savings vault with streaks, XP, levels, and milestones."""

    def __init__(self) -> None:
        self.milestone_10 = GlobalState(
            UInt64(10_000_000),
            key="milestone_10",
            description="Threshold for 10 ALGO milestone",
        )
        self.milestone_50 = GlobalState(
            UInt64(50_000_000),
            key="milestone_50",
            description="Threshold for 50 ALGO milestone",
        )
        self.milestone_100 = GlobalState(
            UInt64(100_000_000),
            key="milestone_100",
            description="Threshold for 100 ALGO milestone",
        )
        self.milestone_500 = GlobalState(
            UInt64(500_000_000),
            key="milestone_500",
            description="Threshold for 500 ALGO milestone",
        )
        self.milestone_1000 = GlobalState(
            UInt64(1_000_000_000),
            key="milestone_1000",
            description="Threshold for 1000 ALGO milestone",
        )
        self.total_deposited_global = GlobalState(
            UInt64(0),
            key="total_deposited_global",
            description="Sum of all user deposits",
        )
        self.total_users = GlobalState(
            UInt64(0),
            key="total_users",
            description="Count of opted-in users",
        )

        self.total_saved = LocalState(
            UInt64,
            key="total_saved",
            description="Total microALGO saved by the user",
        )
        self.deposit_count = LocalState(
            UInt64,
            key="deposit_count",
            description="Number of deposits made by the user",
        )
        self.highest_milestone = LocalState(
            UInt64,
            key="highest_milestone",
            description="Highest milestone reached by the user",
        )
        self.last_deposit_round = LocalState(
            UInt64,
            key="last_deposit_round",
            description="Round number of the most recent deposit",
        )
        self.streak_days = LocalState(
            UInt64,
            key="streak_days",
            description="Consecutive daily deposit streak",
        )
        self.xp_points = LocalState(
            UInt64,
            key="xp_points",
            description="Gamification XP accumulated by the user",
        )
        self.level = LocalState(
            UInt64,
            key="level",
            description="User level derived from XP",
        )

    @subroutine
    def _assert_opted_in(self, account: Account) -> None:
        current_total_saved, exists = self.total_saved.maybe(account)
        assert exists, "Account must opt in first"
        assert current_total_saved >= UInt64(0)

    @subroutine
    def _calculate_level(self, xp: UInt64) -> UInt64:
        if xp < UInt64(500):
            return UInt64(1)
        if xp < UInt64(1_500):
            return UInt64(2)
        if xp < UInt64(3_000):
            return UInt64(3)
        if xp < UInt64(5_000):
            return UInt64(4)
        if xp < UInt64(8_000):
            return UInt64(5)
        return UInt64(6)

    @subroutine
    def _check_milestone(self, total_saved: UInt64) -> UInt64:
        if total_saved >= self.milestone_1000.value:
            return UInt64(5)
        if total_saved >= self.milestone_500.value:
            return UInt64(4)
        if total_saved >= self.milestone_100.value:
            return UInt64(3)
        if total_saved >= self.milestone_50.value:
            return UInt64(2)
        if total_saved >= self.milestone_10.value:
            return UInt64(1)
        return UInt64(0)

    @arc4.baremethod(allow_actions=["OptIn"], create="disallow")
    def opt_in(self) -> None:
        account = Txn.sender

        self.total_saved[account] = UInt64(0)
        self.deposit_count[account] = UInt64(0)
        self.highest_milestone[account] = UInt64(0)
        self.last_deposit_round[account] = UInt64(0)
        self.streak_days[account] = UInt64(0)
        self.xp_points[account] = UInt64(0)
        self.level[account] = UInt64(1)

        self.total_users.value = self.total_users.value + UInt64(1)
        log("User opted in")

    @arc4.abimethod
    def deposit(self, payment: gtxn.PaymentTransaction) -> None:
        account = Txn.sender
        self._assert_opted_in(account)

        assert payment.sender == account, "Payment sender mismatch"
        assert (
            payment.receiver == Global.current_application_address
        ), "Payment must target the app"
        assert payment.amount > UInt64(0), "Deposit amount must be positive"

        total_saved = self.total_saved[account]
        deposit_count = self.deposit_count[account]
        last_round = self.last_deposit_round[account]
        streak_days = self.streak_days[account]
        xp_points = self.xp_points[account]
        highest_milestone = self.highest_milestone[account]

        new_total_saved = total_saved + payment.amount
        self.total_saved[account] = new_total_saved
        self.deposit_count[account] = deposit_count + UInt64(1)
        self.last_deposit_round[account] = Global.round

        rounds_since_last = Global.round - last_round
        if last_round == UInt64(0):
            new_streak = UInt64(1)
        elif rounds_since_last <= ONE_DAY_ROUNDS:
            new_streak = streak_days + UInt64(1)
        elif rounds_since_last <= TWO_DAY_ROUNDS:
            new_streak = UInt64(1)
        else:
            new_streak = UInt64(1)
        self.streak_days[account] = new_streak

        algo_amount = payment.amount // MICRO_ALGO
        xp_gained = algo_amount * UInt64(10)
        new_xp = xp_points + xp_gained
        self.xp_points[account] = new_xp
        self.level[account] = self._calculate_level(new_xp)

        new_milestone = self._check_milestone(new_total_saved)
        if new_milestone > highest_milestone:
            self.highest_milestone[account] = new_milestone

        self.total_deposited_global.value = (
            self.total_deposited_global.value + payment.amount
        )
        log("Deposit successful")

    @arc4.abimethod
    def withdraw(self, amount: UInt64) -> None:
        account = Txn.sender
        self._assert_opted_in(account)

        assert amount > UInt64(0), "Withdraw amount must be positive"

        total_saved = self.total_saved[account]
        assert amount <= total_saved, "Insufficient balance"

        itxn.Payment(
            receiver=account,
            amount=amount,
            note=b"Withdrawal from SavingsVault",
        ).submit()

        self.total_saved[account] = total_saved - amount
        self.total_deposited_global.value = (
            self.total_deposited_global.value - amount
        )
        log("Withdrawal successful")

    @arc4.abimethod(readonly=True)
    def get_savings(self) -> UInt64:
        return self.total_saved.get(Txn.sender, UInt64(0))

    @arc4.abimethod(readonly=True)
    def get_stats(self) -> tuple[UInt64, UInt64, UInt64, UInt64, UInt64, UInt64]:
        account = Txn.sender
        return (
            self.total_saved.get(account, UInt64(0)),
            self.deposit_count.get(account, UInt64(0)),
            self.streak_days.get(account, UInt64(0)),
            self.xp_points.get(account, UInt64(0)),
            self.level.get(account, UInt64(1)),
            self.highest_milestone.get(account, UInt64(0)),
        )

    @arc4.baremethod(allow_actions=["CloseOut"], create="disallow")
    def close_out(self) -> None:
        account = Txn.sender
        total_saved = self.total_saved.get(account, UInt64(0))

        if total_saved > UInt64(0):
            itxn.Payment(
                receiver=account,
                amount=total_saved,
                note=b"Closing account from SavingsVault",
            ).submit()
            self.total_deposited_global.value = (
                self.total_deposited_global.value - total_saved
            )

        if self.total_users.value > UInt64(0):
            self.total_users.value = self.total_users.value - UInt64(1)

        log("Account closed")

    @arc4.abimethod(readonly=True)
    def get_global_stats(self) -> tuple[UInt64, UInt64]:
        return (self.total_deposited_global.value, self.total_users.value)

    @arc4.abimethod(readonly=True)
    def get_milestone_thresholds(
        self,
    ) -> tuple[UInt64, UInt64, UInt64, UInt64, UInt64]:
        return (
            self.milestone_10.value,
            self.milestone_50.value,
            self.milestone_100.value,
            self.milestone_500.value,
            self.milestone_1000.value,
        )
