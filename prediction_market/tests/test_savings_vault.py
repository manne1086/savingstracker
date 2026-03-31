"""
Comprehensive test suite for SavingsVault smart contract.
Tests core functionality: deposits, withdrawals, streaks, XP, levels, milestones.
"""

import pytest
from algosdk.transaction import PaymentTxn, OnComplete, ApplicationNoOpCallTransaction
from algopy_testing import AlgorandTestContext, algorandFixture
from algopy_testing.mock import ARC4Contract

from smart_contracts.savings_wallet.contract import SavingsVault


@pytest.fixture
def vault_app(algorandFixture):
    """Create a deployed SavingsVault application."""
    app = algorandFixture.deploy_app(
        app=SavingsVault(),
        global_schema=SavingsVault.global_state,
        local_schema=SavingsVault.local_state,
    )
    return app


@pytest.fixture
def user1(algorandFixture):
    """Test user account 1."""
    return algorandFixture.create_account(balance=1_000_000_000)  # 1000 ALGO


@pytest.fixture
def user2(algorandFixture):
    """Test user account 2."""
    return algorandFixture.create_account(balance=500_000_000)  # 500 ALGO


class TestOptIn:
    """Test account initialization."""
    
    def test_opt_in_initializes_local_state(self, vault_app, user1, algorandFixture):
        """Verify opt_in sets all local state to 0."""
        txn = vault_app.opt_in(sender=user1)
        algorandFixture.submit_and_confirm(txn)
        
        # Verify local state initialized
        state = algorandFixture.get_local_state(vault_app, user1)
        assert state["total_saved"] == 0
        assert state["deposit_count"] == 0
        assert state["highest_milestone"] == 0
        assert state["last_deposit_round"] == 0
        assert state["streak_days"] == 0
        assert state["xp_points"] == 0
        assert state["level"] == 1
    
    def test_opt_in_increments_total_users(self, vault_app, user1, user2, algorandFixture):
        """Verify opt_in increments global total_users."""
        initial_global = algorandFixture.get_global_state(vault_app)
        initial_users = initial_global.get("total_users", 0)
        
        # User 1 opts in
        txn1 = vault_app.opt_in(sender=user1)
        algorandFixture.submit_and_confirm(txn1)
        
        global_state = algorandFixture.get_global_state(vault_app)
        assert global_state["total_users"] == initial_users + 1
        
        # User 2 opts in
        txn2 = vault_app.opt_in(sender=user2)
        algorandFixture.submit_and_confirm(txn2)
        
        global_state = algorandFixture.get_global_state(vault_app)
        assert global_state["total_users"] == initial_users + 2


class TestDeposit:
    """Test deposit functionality."""
    
    def test_deposit_basic(self, vault_app, user1, algorandFixture):
        """Test basic deposit updates total_saved."""
        algorandFixture.submit_and_confirm(vault_app.opt_in(sender=user1))
        
        deposit_amount = 10_000_000  # 10 ALGO
        payment = PaymentTxn(
            sender=user1,
            index=1,
            amount=deposit_amount,
            receiver=vault_app.app_address,
        )
        
        txn = vault_app.deposit(payment, sender=user1)
        algorandFixture.submit_and_confirm(txn)
        
        state = algorandFixture.get_local_state(vault_app, user1)
        assert state["total_saved"] == deposit_amount
        assert state["deposit_count"] == 1
    
    def test_deposit_xp_calculation(self, vault_app, user1, algorandFixture):
        """Test XP calculation: XP = (ALGO * 10)."""
        algorandFixture.submit_and_confirm(vault_app.opt_in(sender=user1))
        
        # Deposit 5 ALGO = 5,000,000 microALGO = 50 XP
        deposit_amount = 5_000_000
        payment = PaymentTxn(
            sender=user1,
            index=1,
            amount=deposit_amount,
            receiver=vault_app.app_address,
        )
        
        txn = vault_app.deposit(payment, sender=user1)
        algorandFixture.submit_and_confirm(txn)
        
        state = algorandFixture.get_local_state(vault_app, user1)
        expected_xp = (deposit_amount // 1_000_000) * 10
        assert state["xp_points"] == expected_xp  # 50 XP
    
    def test_deposit_level_progression(self, vault_app, user1, algorandFixture):
        """Test level updates based on XP thresholds."""
        algorandFixture.submit_and_confirm(vault_app.opt_in(sender=user1))
        
        # Deposit 50 ALGO = 500 XP (reaches level 2 threshold)
        deposit_amount = 50_000_000
        payment = PaymentTxn(
            sender=user1,
            index=1,
            amount=deposit_amount,
            receiver=vault_app.app_address,
        )
        
        txn = vault_app.deposit(payment, sender=user1)
        algorandFixture.submit_and_confirm(txn)
        
        state = algorandFixture.get_local_state(vault_app, user1)
        assert state["xp_points"] == 500
        assert state["level"] == 2  # 500 XP threshold
    
    def test_deposit_milestone_unlock(self, vault_app, user1, algorandFixture):
        """Test milestone tracking."""
        algorandFixture.submit_and_confirm(vault_app.opt_in(sender=user1))
        
        # Deposit exactly 10 ALGO (milestone_10)
        deposit_amount = 10_000_000
        payment = PaymentTxn(
            sender=user1,
            index=1,
            amount=deposit_amount,
            receiver=vault_app.app_address,
        )
        
        txn = vault_app.deposit(payment, sender=user1)
        algorandFixture.submit_and_confirm(txn)
        
        state = algorandFixture.get_local_state(vault_app, user1)
        assert state["highest_milestone"] == 1  # 10 ALGO milestone
    
    def test_deposit_streak_first_day(self, vault_app, user1, algorandFixture):
        """Test first deposit initializes streak."""
        algorandFixture.submit_and_confirm(vault_app.opt_in(sender=user1))
        
        deposit_amount = 1_000_000  # 1 ALGO
        payment = PaymentTxn(
            sender=user1,
            index=1,
            amount=deposit_amount,
            receiver=vault_app.app_address,
        )
        
        txn = vault_app.deposit(payment, sender=user1)
        algorandFixture.submit_and_confirm(txn)
        
        state = algorandFixture.get_local_state(vault_app, user1)
        # First deposit should have last_deposit_round = 0, so streak = 1
        assert state["streak_days"] == 1
    
    def test_deposit_updates_global_totals(self, vault_app, user1, algorandFixture):
        """Test global state updated on deposit."""
        algorandFixture.submit_and_confirm(vault_app.opt_in(sender=user1))
        
        deposit_amount = 25_000_000  # 25 ALGO
        payment = PaymentTxn(
            sender=user1,
            index=1,
            amount=deposit_amount,
            receiver=vault_app.app_address,
        )
        
        txn = vault_app.deposit(payment, sender=user1)
        algorandFixture.submit_and_confirm(txn)
        
        global_state = algorandFixture.get_global_state(vault_app)
        assert global_state["total_deposited_global"] == deposit_amount
    
    def test_multiple_deposits_accumulate(self, vault_app, user1, algorandFixture):
        """Test multiple deposits accumulate correctly."""
        algorandFixture.submit_and_confirm(vault_app.opt_in(sender=user1))
        
        # First deposit
        payment1 = PaymentTxn(
            sender=user1,
            index=1,
            amount=10_000_000,
            receiver=vault_app.app_address,
        )
        algorandFixture.submit_and_confirm(vault_app.deposit(payment1, sender=user1))
        
        # Second deposit
        payment2 = PaymentTxn(
            sender=user1,
            index=1,
            amount=20_000_000,
            receiver=vault_app.app_address,
        )
        algorandFixture.submit_and_confirm(vault_app.deposit(payment2, sender=user1))
        
        state = algorandFixture.get_local_state(vault_app, user1)
        assert state["total_saved"] == 30_000_000  # 30 ALGO total
        assert state["deposit_count"] == 2
        assert state["xp_points"] == 300  # 30 ALGO * 10


class TestWithdraw:
    """Test withdrawal functionality."""
    
    def test_withdraw_basic(self, vault_app, user1, algorandFixture):
        """Test basic withdrawal reduces balance."""
        algorandFixture.submit_and_confirm(vault_app.opt_in(sender=user1))
        
        # Deposit
        deposit = PaymentTxn(
            sender=user1,
            index=1,
            amount=50_000_000,
            receiver=vault_app.app_address,
        )
        algorandFixture.submit_and_confirm(vault_app.deposit(deposit, sender=user1))
        
        # Withdraw 20 ALGO
        txn = vault_app.withdraw(20_000_000, sender=user1)
        algorandFixture.submit_and_confirm(txn)
        
        state = algorandFixture.get_local_state(vault_app, user1)
        assert state["total_saved"] == 30_000_000  # 50 - 20
    
    def test_withdraw_preserves_streak(self, vault_app, user1, algorandFixture):
        """Test withdrawal does NOT reset streak."""
        algorandFixture.submit_and_confirm(vault_app.opt_in(sender=user1))
        
        deposit = PaymentTxn(
            sender=user1,
            index=1,
            amount=50_000_000,
            receiver=vault_app.app_address,
        )
        algorandFixture.submit_and_confirm(vault_app.deposit(deposit, sender=user1))
        
        state_before = algorandFixture.get_local_state(vault_app, user1)
        streak_before = state_before["streak_days"]
        
        # Withdraw
        txn = vault_app.withdraw(10_000_000, sender=user1)
        algorandFixture.submit_and_confirm(txn)
        
        state_after = algorandFixture.get_local_state(vault_app, user1)
        assert state_after["streak_days"] == streak_before  # Streak unchanged
    
    def test_withdraw_preserves_xp(self, vault_app, user1, algorandFixture):
        """Test withdrawal does NOT reset XP."""
        algorandFixture.submit_and_confirm(vault_app.opt_in(sender=user1))
        
        deposit = PaymentTxn(
            sender=user1,
            index=1,
            amount=50_000_000,
            receiver=vault_app.app_address,
        )
        algorandFixture.submit_and_confirm(vault_app.deposit(deposit, sender=user1))
        
        state_before = algorandFixture.get_local_state(vault_app, user1)
        xp_before = state_before["xp_points"]
        
        # Withdraw
        txn = vault_app.withdraw(10_000_000, sender=user1)
        algorandFixture.submit_and_confirm(txn)
        
        state_after = algorandFixture.get_local_state(vault_app, user1)
        assert state_after["xp_points"] == xp_before  # XP unchanged
    
    def test_withdraw_updates_global_total(self, vault_app, user1, algorandFixture):
        """Test global total_deposited decremented on withdraw."""
        algorandFixture.submit_and_confirm(vault_app.opt_in(sender=user1))
        
        deposit = PaymentTxn(
            sender=user1,
            index=1,
            amount=50_000_000,
            receiver=vault_app.app_address,
        )
        algorandFixture.submit_and_confirm(vault_app.deposit(deposit, sender=user1))
        
        global_before = algorandFixture.get_global_state(vault_app)
        total_before = global_before["total_deposited_global"]
        
        # Withdraw 20 ALGO
        txn = vault_app.withdraw(20_000_000, sender=user1)
        algorandFixture.submit_and_confirm(txn)
        
        global_after = algorandFixture.get_global_state(vault_app)
        assert global_after["total_deposited_global"] == total_before - 20_000_000


class TestQueries:
    """Test read-only query methods."""
    
    def test_get_savings(self, vault_app, user1, algorandFixture):
        """Test get_savings query."""
        algorandFixture.submit_and_confirm(vault_app.opt_in(sender=user1))
        
        deposit = PaymentTxn(
            sender=user1,
            index=1,
            amount=35_000_000,
            receiver=vault_app.app_address,
        )
        algorandFixture.submit_and_confirm(vault_app.deposit(deposit, sender=user1))
        
        result = vault_app.get_savings(sender=user1)
        assert result == 35_000_000
    
    def test_get_stats(self, vault_app, user1, algorandFixture):
        """Test get_stats returns all 6 values correctly."""
        algorandFixture.submit_and_confirm(vault_app.opt_in(sender=user1))
        
        deposit = PaymentTxn(
            sender=user1,
            index=1,
            amount=100_000_000,  # 100 ALGO
            receiver=vault_app.app_address,
        )
        algorandFixture.submit_and_confirm(vault_app.deposit(deposit, sender=user1))
        
        stats = vault_app.get_stats(sender=user1)
        total_saved, deposit_count, streak, xp, level, milestone = stats
        
        assert total_saved == 100_000_000
        assert deposit_count == 1
        assert streak == 1
        assert xp == 1000  # 100 ALGO * 10
        assert level == 3  # 1000 XP is in level 3 range (1500+)
        assert milestone == 3  # 100 ALGO milestone
    
    def test_get_global_stats(self, vault_app, user1, user2, algorandFixture):
        """Test get_global_stats query."""
        algorandFixture.submit_and_confirm(vault_app.opt_in(sender=user1))
        algorandFixture.submit_and_confirm(vault_app.opt_in(sender=user2))
        
        deposit1 = PaymentTxn(
            sender=user1,
            index=1,
            amount=50_000_000,
            receiver=vault_app.app_address,
        )
        algorandFixture.submit_and_confirm(vault_app.deposit(deposit1, sender=user1))
        
        deposit2 = PaymentTxn(
            sender=user2,
            index=1,
            amount=75_000_000,
            receiver=vault_app.app_address,
        )
        algorandFixture.submit_and_confirm(vault_app.deposit(deposit2, sender=user2))
        
        total, users = vault_app.get_global_stats(sender=user1)
        assert total == 125_000_000  # 50 + 75
        assert users == 2


class TestCloseOut:
    """Test close_out functionality."""
    
    def test_close_out_withdraws_balance(self, vault_app, user1, algorandFixture):
        """Test close_out sends remaining balance to user."""
        algorandFixture.submit_and_confirm(vault_app.opt_in(sender=user1))
        
        deposit = PaymentTxn(
            sender=user1,
            index=1,
            amount=30_000_000,
            receiver=vault_app.app_address,
        )
        algorandFixture.submit_and_confirm(vault_app.deposit(deposit, sender=user1))
        
        # Get user balance before close
        balance_before = algorandFixture.get_account_info(user1)["amount"]
        
        # Close out
        txn = vault_app.close_out(sender=user1)
        algorandFixture.submit_and_confirm(txn)
        
        # Balance should increase by deposit amount (minus fees)
        balance_after = algorandFixture.get_account_info(user1)["amount"]
        assert balance_after > balance_before
    
    def test_close_out_decrements_total_users(self, vault_app, user1, user2, algorandFixture):
        """Test close_out decrements global total_users."""
        algorandFixture.submit_and_confirm(vault_app.opt_in(sender=user1))
        algorandFixture.submit_and_confirm(vault_app.opt_in(sender=user2))
        
        global_state = algorandFixture.get_global_state(vault_app)
        users_before = global_state["total_users"]
        
        # User 1 closes out
        txn = vault_app.close_out(sender=user1)
        algorandFixture.submit_and_confirm(txn)
        
        global_state = algorandFixture.get_global_state(vault_app)
        assert global_state["total_users"] == users_before - 1
    
    def test_close_out_updates_global_total(self, vault_app, user1, algorandFixture):
        """Test close_out decrements total_deposited_global."""
        algorandFixture.submit_and_confirm(vault_app.opt_in(sender=user1))
        
        deposit = PaymentTxn(
            sender=user1,
            index=1,
            amount=50_000_000,
            receiver=vault_app.app_address,
        )
        algorandFixture.submit_and_confirm(vault_app.deposit(deposit, sender=user1))
        
        global_before = algorandFixture.get_global_state(vault_app)
        total_before = global_before["total_deposited_global"]
        
        # Close out
        txn = vault_app.close_out(sender=user1)
        algorandFixture.submit_and_confirm(txn)
        
        global_after = algorandFixture.get_global_state(vault_app)
        assert global_after["total_deposited_global"] == total_before - 50_000_000


class TestEdgeCases:
    """Test edge cases and error conditions."""
    
    def test_reject_zero_deposit(self, vault_app, user1, algorandFixture):
        """Test deposit rejects zero amount."""
        algorandFixture.submit_and_confirm(vault_app.opt_in(sender=user1))
        
        payment = PaymentTxn(
            sender=user1,
            index=1,
            amount=0,
            receiver=vault_app.app_address,
        )
        
        with pytest.raises(Exception):  # Should reject
            txn = vault_app.deposit(payment, sender=user1)
            algorandFixture.submit_and_confirm(txn)
    
    def test_reject_withdraw_more_than_balance(self, vault_app, user1, algorandFixture):
        """Test withdraw rejects amount > balance."""
        algorandFixture.submit_and_confirm(vault_app.opt_in(sender=user1))
        
        deposit = PaymentTxn(
            sender=user1,
            index=1,
            amount=10_000_000,  # 10 ALGO
            receiver=vault_app.app_address,
        )
        algorandFixture.submit_and_confirm(vault_app.deposit(deposit, sender=user1))
        
        with pytest.raises(Exception):  # Should reject
            txn = vault_app.withdraw(50_000_000, sender=user1)  # Try to withdraw 50
            algorandFixture.submit_and_confirm(txn)
    
    def test_level_thresholds_precise(self, vault_app, user1, algorandFixture):
        """Test level thresholds at exact boundaries."""
        algorandFixture.submit_and_confirm(vault_app.opt_in(sender=user1))
        
        # Test level boundaries
        thresholds = {
            499: 1,    # Below level 2
            500: 2,    # Exactly level 2
            1499: 2,   # Below level 3
            1500: 3,   # Exactly level 3
            2999: 3,   # Below level 4
            3000: 4,   # Exactly level 4
        }
        
        for xp, expected_level in thresholds.items():
            algorandFixture.submit_and_confirm(vault_app.opt_in(sender=user1))
            
            # Deposit to reach exact XP
            algo_amount = xp // 10
            if algo_amount > 0:
                deposit = PaymentTxn(
                    sender=user1,
                    index=1,
                    amount=algo_amount * 1_000_000,
                    receiver=vault_app.app_address,
                )
                algorandFixture.submit_and_confirm(vault_app.deposit(deposit, sender=user1))
                
                state = algorandFixture.get_local_state(vault_app, user1)
                assert state["level"] == expected_level
