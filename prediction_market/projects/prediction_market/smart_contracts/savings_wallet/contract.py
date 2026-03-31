"""
SavingsVault - Non-custodial ALGO Savings Smart Contract
Built with Algorand Python (Puya) via AlgoKit
"""

from algopy import ARC4Contract, Global, Txn, itxn, log, TxnType
from algopy.arc4 import abimethod, UInt64
from algopy.pytypes import PaymentTransaction


class SavingsVault(ARC4Contract):
    """
    Non-custodial savings vault with gamification features:
    - Streak tracking (consecutive daily deposits)
    - XP points & level progression
    - Milestone badges (10, 50, 100, 500, 1000 ALGO)
    - Leaderboard statistics
    """

    # ════════════════════════════════════════════════════════════════════
    # GLOBAL STATE (7 values - within 16 slot limit)
    # ════════════════════════════════════════════════════════════════════

    def __init__(self) -> None:
        # Global state initialization
        self.milestone_10 = UInt64(10_000_000)  # 10 ALGO in microALGO
        self.milestone_50 = UInt64(50_000_000)
        self.milestone_100 = UInt64(100_000_000)
        self.milestone_500 = UInt64(500_000_000)
        self.milestone_1000 = UInt64(1_000_000_000)
        self.total_deposited_global = UInt64(0)  # Sum of all deposits
        self.total_users = UInt64(0)  # Count of opted-in users

    # ════════════════════════════════════════════════════════════════════
    # LOCAL STATE KEYS (per user - 7 values, within 16 slot limit)
    # ════════════════════════════════════════════════════════════════════

    total_saved_key = "total_saved"
    deposit_count_key = "deposit_count"
    highest_milestone_key = "highest_milestone"
    last_deposit_round_key = "last_deposit_round"
    streak_days_key = "streak_days"
    xp_points_key = "xp_points"
    level_key = "level"

    # ════════════════════════════════════════════════════════════════════
    # METHOD 1: OPT_IN
    # ════════════════════════════════════════════════════════════════════

    @abimethod()
    def opt_in(self) -> None:
        """
        Initialize account in the app.
        Sets all local state to 0, increments total_users.
        """
        # Initialize all local state variables to 0
        Txn.sender.local_put(self.total_saved_key, UInt64(0))
        Txn.sender.local_put(self.deposit_count_key, UInt64(0))
        Txn.sender.local_put(self.highest_milestone_key, UInt64(0))
        Txn.sender.local_put(self.last_deposit_round_key, UInt64(0))
        Txn.sender.local_put(self.streak_days_key, UInt64(0))
        Txn.sender.local_put(self.xp_points_key, UInt64(0))
        Txn.sender.local_put(self.level_key, UInt64(1))

        # Increment total users
        self.total_users = self.total_users + UInt64(1)

        log("User opted in")

    # ════════════════════════════════════════════════════════════════════
    # METHOD 2: DEPOSIT (core method)
    # ════════════════════════════════════════════════════════════════════

    @abimethod()
    def deposit(self, payment: PaymentTransaction) -> None:
        """
        Deposit ALGO into savings vault.
        
        Verifies payment, updates stats, handles streaks/XP/levels/milestones.
        
        Args:
            payment: PaymentTransaction to the app address
        """
        # Verify payment structure
        assert payment.receiver == Global.current_application_address, "Payment must be to app"
        assert payment.amount > UInt64(0), "Deposit amount must be positive"
        assert payment.sender == Txn.sender, "Sender mismatch"
        assert payment.type_enum == TxnType.Payment, "Must be payment transaction"

        # Get current user stats
        total_saved, _ = Txn.sender.local_get_ex(self.total_saved_key)
        deposit_count, _ = Txn.sender.local_get_ex(self.deposit_count_key)
        last_round, _ = Txn.sender.local_get_ex(self.last_deposit_round_key)
        streak_days, _ = Txn.sender.local_get_ex(self.streak_days_key)
        xp_points, _ = Txn.sender.local_get_ex(self.xp_points_key)
        highest_milestone, _ = Txn.sender.local_get_ex(self.highest_milestone_key)

        # ─── Update Total Saved ───
        new_total_saved = total_saved + payment.amount
        Txn.sender.local_put(self.total_saved_key, new_total_saved)

        # ─── Update Deposit Count ───
        new_deposit_count = deposit_count + UInt64(1)
        Txn.sender.local_put(self.deposit_count_key, new_deposit_count)

        # ─── Update Last Deposit Round ───
        Txn.sender.local_put(self.last_deposit_round_key, Global.round)

        # ─── STREAK LOGIC ───
        # 1440 rounds ≈ 1 day on Algorand mainnet (6 sec per block)
        blocks_since_last = Global.round - last_round
        one_day_blocks = UInt64(1440)
        two_day_blocks = UInt64(2880)

        if blocks_since_last <= one_day_blocks:
            # Within 1 day: increment streak
            new_streak = streak_days + UInt64(1)
        elif blocks_since_last <= two_day_blocks:
            # Between 1-2 days: keep as 1
            new_streak = UInt64(1)
        else:
            # More than 2 days: reset streak to 1
            new_streak = UInt64(1)

        Txn.sender.local_put(self.streak_days_key, new_streak)

        # ─── XP LOGIC ───
        # XP = (amount in ALGO) * 10
        algo_amount = payment.amount / UInt64(1_000_000)
        xp_gained = algo_amount * UInt64(10)
        new_xp = xp_points + xp_gained
        Txn.sender.local_put(self.xp_points_key, new_xp)

        # ─── LEVEL LOGIC ───
        # Determine level from XP thresholds
        new_level = self.calculate_level(new_xp)
        Txn.sender.local_put(self.level_key, new_level)

        # ─── MILESTONE CHECK ───
        new_milestone = self.check_milestone(new_total_saved)
        if new_milestone > highest_milestone:
            Txn.sender.local_put(self.highest_milestone_key, new_milestone)

        # ─── Update Global Stats ───
        self.total_deposited_global = self.total_deposited_global + payment.amount

        # ─── Log Event ───
        log("Deposit successful")

    # ════════════════════════════════════════════════════════════════════
    # METHOD 3: WITHDRAW
    # ════════════════════════════════════════════════════════════════════

    @abimethod()
    def withdraw(self, amount: UInt64) -> None:
        """
        Withdraw ALGO from savings vault.
        
        Reduced balance does NOT reset streak or XP.
        
        Args:
            amount: microALGO to withdraw
        """
        # Verify amount
        assert amount > UInt64(0), "Withdraw amount must be positive"

        total_saved, _ = Txn.sender.local_get_ex(self.total_saved_key)
        assert amount <= total_saved, "Insufficient balance"

        # ─── Send Inner Transaction to User ───
        itxn.Payment(
            receiver=Txn.sender,
            amount=amount,
            note=b"Withdrawal from SavingsVault",
        ).submit()

        # ─── Update Local State ───
        new_total_saved = total_saved - amount
        Txn.sender.local_put(self.total_saved_key, new_total_saved)

        # ─── Update Global State ───
        self.total_deposited_global = self.total_deposited_global - amount

        # ─── NOTE: Streak and XP are NOT reset on withdrawal ───

        log("Withdrawal successful")

    # ════════════════════════════════════════════════════════════════════
    # METHOD 4: GET_SAVINGS
    # ════════════════════════════════════════════════════════════════════

    @abimethod(readonly=True)
    def get_savings(self) -> UInt64:
        """
        Get total savings for caller.
        
        Returns:
            microALGO saved by user
        """
        total_saved, has_saved = Txn.sender.local_get_ex(self.total_saved_key)
        if not has_saved:
            return UInt64(0)
        return total_saved

    # ════════════════════════════════════════════════════════════════════
    # METHOD 5: GET_STATS (comprehensive user stats)
    # ════════════════════════════════════════════════════════════════════

    @abimethod(readonly=True)
    def get_stats(self) -> tuple[UInt64, UInt64, UInt64, UInt64, UInt64, UInt64]:
        """
        Get all gamification stats for caller.
        
        Returns:
            (total_saved, deposit_count, streak_days, xp_points, level, highest_milestone)
        """
        total_saved, _ = Txn.sender.local_get_ex(self.total_saved_key)
        deposit_count, _ = Txn.sender.local_get_ex(self.deposit_count_key)
        streak_days, _ = Txn.sender.local_get_ex(self.streak_days_key)
        xp_points, _ = Txn.sender.local_get_ex(self.xp_points_key)
        level, _ = Txn.sender.local_get_ex(self.level_key)
        highest_milestone, _ = Txn.sender.local_get_ex(self.highest_milestone_key)

        return (total_saved, deposit_count, streak_days, xp_points, level, highest_milestone)

    # ════════════════════════════════════════════════════════════════════
    # METHOD 6: CLOSE_OUT
    # ════════════════════════════════════════════════════════════════════

    @abimethod()
    def close_out(self) -> None:
        """
        Close account and withdraw remaining balance.
        
        Clears all local state and decrements total_users.
        """
        total_saved, _ = Txn.sender.local_get_ex(self.total_saved_key)

        if total_saved > UInt64(0):
            # Send remaining balance to user
            itxn.Payment(
                receiver=Txn.sender,
                amount=total_saved,
                note=b"Closing account from SavingsVault",
            ).submit()

            # Update global state
            self.total_deposited_global = self.total_deposited_global - total_saved

        # Decrement user count
        self.total_users = self.total_users - UInt64(1)

        log("Account closed")

    # ════════════════════════════════════════════════════════════════════
    # HELPER METHODS
    # ════════════════════════════════════════════════════════════════════

    @abimethod(readonly=True)
    def calculate_level(self, xp: UInt64) -> UInt64:
        """
        Calculate level from XP points.
        
        Level thresholds:
        - Level 1: 0 XP
        - Level 2: 500 XP
        - Level 3: 1500 XP
        - Level 4: 3000 XP
        - Level 5: 5000 XP
        - Level 6: 8000+ XP
        """
        if xp < UInt64(500):
            return UInt64(1)
        elif xp < UInt64(1500):
            return UInt64(2)
        elif xp < UInt64(3000):
            return UInt64(3)
        elif xp < UInt64(5000):
            return UInt64(4)
        elif xp < UInt64(8000):
            return UInt64(5)
        else:
            return UInt64(6)

    @abimethod(readonly=True)
    def check_milestone(self, total_saved: UInt64) -> UInt64:
        """
        Check which milestone has been reached.
        
        Milestones:
        - 0: None
        - 1: 10 ALGO
        - 2: 50 ALGO
        - 3: 100 ALGO
        - 4: 500 ALGO
        - 5: 1000 ALGO
        """
        if total_saved >= self.milestone_1000:
            return UInt64(5)
        elif total_saved >= self.milestone_500:
            return UInt64(4)
        elif total_saved >= self.milestone_100:
            return UInt64(3)
        elif total_saved >= self.milestone_50:
            return UInt64(2)
        elif total_saved >= self.milestone_10:
            return UInt64(1)
        else:
            return UInt64(0)

    # ════════════════════════════════════════════════════════════════════
    # GLOBAL STATS QUERIES
    # ════════════════════════════════════════════════════════════════════

    @abimethod(readonly=True)
    def get_global_stats(self) -> tuple[UInt64, UInt64]:
        """
        Get global vault statistics.
        
        Returns:
            (total_deposited, total_users)
        """
        return (self.total_deposited_global, self.total_users)

    @abimethod(readonly=True)
    def get_milestone_thresholds(self) -> tuple[UInt64, UInt64, UInt64, UInt64, UInt64]:
        """
        Get all milestone thresholds in microALGO.
        
        Returns:
            (10_ALGO, 50_ALGO, 100_ALGO, 500_ALGO, 1000_ALGO)
        """
        return (
            self.milestone_10,
            self.milestone_50,
            self.milestone_100,
            self.milestone_500,
            self.milestone_1000,
        )
