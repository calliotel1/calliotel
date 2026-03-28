"""
Stripe Checkout Service
Handles Stripe payment session creation for Calliotel
"""
import stripe
import os
from typing import Optional
from pydantic import BaseModel
import logging

logger = logging.getLogger(__name__)

# Initialize Stripe with API key from environment
stripe.api_key = os.getenv('STRIPE_API_KEY') or os.getenv('STRIPE_SECRET_KEY')

class CheckoutRequest(BaseModel):
    user_id: str
    user_email: str
    amount: float
    currency: str = "usd"
    success_url: str
    cancel_url: str
    product_name: str
    product_description: Optional[str] = None

class CheckoutSessionResponse(BaseModel):
    url: str
    session_id: str

async def create_checkout_session(request: CheckoutRequest) -> CheckoutSessionResponse:
    """
    Create a Stripe checkout session
    """
    try:
        logger.info(f"Creating Stripe session for {request.user_email}, amount: ${request.amount}")
        
        # Create Stripe checkout session
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': request.currency,
                    'unit_amount': int(request.amount * 100),  # Convert to cents
                    'product_data': {
                        'name': request.product_name,
                        'description': request.product_description or f"Purchase for {request.user_email}",
                    },
                },
                'quantity': 1,
            }],
            mode='payment',
            success_url=request.success_url,
            cancel_url=request.cancel_url,
            client_reference_id=request.user_id,
            customer_email=request.user_email,
        )
        
        logger.info(f"✅ Stripe session created: {session.id}")
        
        return CheckoutSessionResponse(
            url=session.url,
            session_id=session.id
        )
        
    except stripe.error.StripeError as e:
        logger.error(f"❌ Stripe error: {str(e)}")
        raise Exception(f"Stripe error: {str(e)}")
    except Exception as e:
        logger.error(f"❌ Failed to create checkout session: {str(e)}")
        raise Exception(f"Failed to create checkout session: {str(e)}")
