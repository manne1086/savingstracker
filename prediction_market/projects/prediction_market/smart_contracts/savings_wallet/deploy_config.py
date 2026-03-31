import logging
import os

import algokit_utils

logger = logging.getLogger(__name__)


# define deployment behaviour based on supplied app spec
def deploy() -> None:
    from smart_contracts.artifacts.savings_wallet.savings_vault_client import (
        SavingsVaultFactory,
    )

    algorand = algokit_utils.AlgorandClient.from_environment()
    
    # Try to get deployer from environment, fallback to KMD for localnet
    try:
        deployer_ = algorand.account.from_environment("DEPLOYER")
    except Exception as e:
        logger.warning(f"Could not load DEPLOYER from environment: {e}")
        logger.info("Attempting to use KMD default account for localnet")
        # Use KMD provider for localnet
        deployer_ = algorand.account.get_dispenser()
        logger.info(f"Using KMD dispenser account: {deployer_.address}")

    factory = algorand.client.get_typed_app_factory(
        SavingsVaultFactory, default_sender=deployer_.address
    )

    app_client, result = factory.deploy(
        on_update=algokit_utils.OnUpdate.AppendApp,
        on_schema_break=algokit_utils.OnSchemaBreak.AppendApp,
    )

    if result.operation_performed in [
        algokit_utils.OperationPerformed.Create,
        algokit_utils.OperationPerformed.Replace,
    ]:
        algorand.send.payment(
            algokit_utils.PaymentParams(
                amount=algokit_utils.AlgoAmount(algo=1),
                sender=deployer_.address,
                receiver=app_client.app_address,
            )
        )

    logger.info(
        "Deployed %s (%s) via %s",
        app_client.app_name,
        app_client.app_id,
        result.operation_performed,
    )
