"""
Deployment configuration for SavingsVault smart contract.
Configures contract deployment to AlgoKit LocalNet, TestNet, or MainNet.
"""

from algopy_builder import (
    ABIMethod,
    Bare,
    ContractSpec,
    CreateOnCompletion,
    DeleteOnCompletion,
    GlobalStateSchema,
    LocalStateSchema,
    OnCompleteActions,
    UpdateOnCompletion,
)

from smart_contracts.savings_wallet.contract import SavingsVault


def get_contract_spec() -> ContractSpec:
    """
    Generate the contract specification for the SavingsVault.
    
    This defines:
    - Global state schema (7 state variables)
    - Local state schema (7 state variables per user)
    - ABI methods
    - OnComplete behavior
    
    Returns:
        ContractSpec with full contract metadata
    """
    
    # Global State Schema
    # 7 values: 5 milestones (uint64) + global aggregates (uint64 x2)
    global_state = GlobalStateSchema(
        num_byte_slices=0,  # No byte strings needed
        num_uints=7,  # milestone_10, 50, 100, 500, 1000, total_deposited, total_users
    )
    
    # Local State Schema per User
    # 7 values: total_saved, deposit_count, highest_milestone, last_deposit_round, 
    #           streak_days, xp_points, level
    local_state = LocalStateSchema(
        num_byte_slices=0,  # No byte strings per user
        num_uints=7,  # User-specific stats
    )
    
    # Create contract spec
    spec = ContractSpec(
        name="SavingsVault",
        desc="Non-custodial ALGO savings vault with gamification features",
        clear_state_program=Bare.clear_state_program(),
        approval_program=Bare.approval_program(SavingsVault),
        global_state_schema=global_state,
        local_state_schema=local_state,
        # Define supported operations
        create=CreateOnCompletion(
            approval_program=Bare.approval_program(SavingsVault),
            clear_state_program=Bare.clear_state_program(),
            global_state_schema=global_state,
            local_state_schema=local_state,
        ),
        delete=DeleteOnCompletion(),
        update=UpdateOnCompletion(
            approval_program=Bare.approval_program(SavingsVault),
            clear_state_program=Bare.clear_state_program(),
        ),
    )
    
    return spec


# ════════════════════════════════════════════════════════════════════
# DEPLOYMENT PARAMETERS
# ════════════════════════════════════════════════════════════════════

# Network configurations
NETWORKS = {
    "localnet": {
        "name": "LocalNet",
        "network": "localnet",
        "algod_token": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        "algod_server": "http://localhost:4001",
        "indexer_server": "http://localhost:8980",
    },
    "testnet": {
        "name": "TestNet",
        "network": "testnet",
        "algod_token": "",  # Use Nodely free tier or AlgoKit dispenser
        "algod_server": "https://testnet-api.algonode.cloud",
        "indexer_server": "https://testnet-idx.algonode.cloud",
    },
    "mainnet": {
        "name": "MainNet",
        "network": "mainnet",
        "algod_token": "",  # Use Nodely free tier
        "algod_server": "https://mainnet-api.algonode.cloud",
        "indexer_server": "https://mainnet-idx.algonode.cloud",
    },
}

# Application OnComplete actions
APP_ONCOMPLETE = {
    "create": CreateOnCompletion.NoOp,
    "update": UpdateOnCompletion.NoOp,
    "delete": DeleteOnCompletion.NoOp,
}

# ════════════════════════════════════════════════════════════════════
# CONTRACT DEPLOYMENT INFO
# ════════════════════════════════════════════════════════════════════

CONTRACT_INFO = {
    "name": "SavingsVault",
    "description": "Non-custodial ALGO savings vault with XP, levels, streaks, and milestones",
    "version": "1.0.0",
    "methods": {
        "opt_in": {
            "desc": "Initialize user account in contract",
            "note": "Must be called once before first deposit",
        },
        "deposit": {
            "desc": "Deposit ALGO into savings vault",
            "args": ["payment: PaymentTransaction"],
            "note": "Atomically updates streak, XP, level, and milestone state",
        },
        "withdraw": {
            "desc": "Withdraw ALGO from savings",
            "args": ["amount: uint64"],
        },
        "get_savings": {
            "desc": "Query total savings balance",
            "readonly": True,
        },
        "get_stats": {
            "desc": "Get gamification stats (total_saved, deposit_count, streak, xp, level, milestone)",
            "readonly": True,
            "returns": "tuple[uint64; 6]",
        },
        "close_out": {
            "desc": "Close account and withdraw remaining balance",
        },
        "get_global_stats": {
            "desc": "Get global vault stats",
            "readonly": True,
            "returns": "tuple[uint64; 2]",  # (total_deposited, total_users)
        },
        "get_milestone_thresholds": {
            "desc": "Get milestone thresholds in microALGO",
            "readonly": True,
            "returns": "tuple[uint64; 5]",  # (10, 50, 100, 500, 1000)
        },
    },
    "global_state": {
        "milestone_10": "Threshold for 10 ALGO milestone",
        "milestone_50": "Threshold for 50 ALGO milestone",
        "milestone_100": "Threshold for 100 ALGO milestone",
        "milestone_500": "Threshold for 500 ALGO milestone",
        "milestone_1000": "Threshold for 1000 ALGO milestone",
        "total_deposited_global": "Sum of all deposits across all users",
        "total_users": "Count of opted-in users",
    },
    "local_state": {
        "total_saved": "Total microALGO saved by user",
        "deposit_count": "Number of deposits made by user",
        "highest_milestone": "Highest milestone reached (0-5)",
        "last_deposit_round": "Round number of most recent deposit",
        "streak_days": "Consecutive daily deposits",
        "xp_points": "Gamification XP accumulated",
        "level": "User level (1-6) derived from XP",
    },
    "gamification": {
        "xp_formula": "XP = (amount in ALGO) * 10",
        "level_thresholds": {
            "1": "0 XP",
            "2": "500 XP",
            "3": "1500 XP",
            "4": "3000 XP",
            "5": "5000 XP",
            "6": "8000+ XP",
        },
        "milestone_thresholds": {
            "1": "10 ALGO",
            "2": "50 ALGO",
            "3": "100 ALGO",
            "4": "500 ALGO",
            "5": "1000 ALGO",
        },
        "streak_logic": {
            "increment": "Deposits within 1 day (~1440 rounds)",
            "reset": "No deposit for 2+ days",
        },
    },
    "security": {
        "custodial_mode": False,
        "admin_keys": None,
        "withdrawal_destination": "Always Txn.sender (non-custodial)",
        "inner_transactions": True,
        "state_schemas": "7/16 global slots, 7/16 local slots",
    },
}
