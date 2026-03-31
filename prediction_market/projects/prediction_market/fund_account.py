#!/usr/bin/env python3
"""Fund an account in LocalNet using the dispenser account."""

import os
from algosdk.transaction import PaymentTxn
from algosdk.v2client import algod
from algosdk import account, mnemonic

# Set up localnet client
algod_token = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
algod_address = "http://localhost:4001"
algod_client = algod.AlgodClient(algod_token, algod_address)

# Dispenser account (default localnet account)
dispenser_mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon art"
dispenser_private_key = mnemonic.to_private_key(dispenser_mnemonic)
dispenser_address = account.address_from_private_key(dispenser_private_key)

# Target account
target = "OMCANTCZX2YZBXL5Q6XAUN67KB3QAPNS6VEDOUYM47FAOZNPP75VU65KI4"

# Get suggested params
params = algod_client.suggested_params()

# Create transaction
txn = PaymentTxn(dispenser_address, params, target, int(10 * 1e6))  # 10 ALGO

# Sign and send
signed_txn = txn.sign(dispenser_private_key)
txid = algod_client.send_transaction(signed_txn)

print(f"✅ Sent 10 ALGO to {target}")
print(f"   TX ID: {txid}")

# Wait for confirmation
import time
while True:
    result = algod_client.pending_transaction_info(txid)
    if result["confirmed-round"]:
        print(f"✅ Transaction confirmed in round {result['confirmed-round']}")
        break
    time.sleep(1)
