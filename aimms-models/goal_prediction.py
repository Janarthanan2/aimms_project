import pandas as pd
from prophet import Prophet
from datetime import datetime, timedelta
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def predict_goal_completion(history, goal_target, goal_current, goal_deadline, goal_created_at=None):
    """
    Predicts goal completion date using Facebook Prophet and Goal-Specific Velocity.
    """
    try:
        # Defaults
        avg_daily_savings = 0.0
        predicted_days = float('inf')
        
        # 1. Calculate Goal-Specific Velocity (Primary Signal)
        specific_daily_savings = 0.0
        if goal_created_at:
            try:
                created_date = datetime.strptime(goal_created_at.split('T')[0], "%Y-%m-%d") # Handle ISO format
                today = datetime.now()
                days_active = (today - created_date).days
                if days_active < 1: days_active = 1
                
                specific_daily_savings = goal_current / days_active
            except Exception as e:
                logger.warning(f"Failed to parse goal_created_at: {e}")

        # 2. Calculate Global Financial Velocity (Secondary Signal via Prophet)
        # (Only used if goal is new or specific velocity is 0)
        global_daily_savings = 0.0
        if history:
            df = pd.DataFrame(history)
            df['date'] = pd.to_datetime(df['date'])
            df['amount'] = df.apply(lambda x: x['amount'] if x['type'] == 'Credit' else -x['amount'], axis=1)
            daily_df = df.groupby('date')['amount'].sum().reset_index()
            daily_df.columns = ['ds', 'y']
            
            if len(daily_df) >= 5:
                model = Prophet(daily_seasonality=True, yearly_seasonality=False, weekly_seasonality=True)
                model.fit(daily_df)
                future = model.make_future_dataframe(periods=30)
                forecast = model.predict(future)
                today_ts = pd.Timestamp.now()
                next_30 = forecast[forecast['ds'] > today_ts].head(30)
                global_daily_savings = next_30['yhat'].mean()
                if pd.isna(global_daily_savings): global_daily_savings = 0.0

        # 3. Hybrid Logic: Prioritize Specific Velocity for accuracy on this specific goal
        # If the user has specifically set aside money for THIS goal, that's the best predictor.
        # Fallback to global savings (assuming they might allocate free cash flow) if key metrics are missing.
        
        if specific_daily_savings > 0:
            avg_daily_savings = specific_daily_savings
        elif global_daily_savings > 0:
            avg_daily_savings = global_daily_savings * 0.5 # Conservatively assume 50% of free cash flow goes here
        else:
            avg_daily_savings = 0.0

        # Calculation
        remaining_amount = goal_target - goal_current
        
        if avg_daily_savings <= 0:
            predicted_days = float('inf')
        else:
            predicted_days = remaining_amount / avg_daily_savings
            
        today_date = datetime.now()
        
        if predicted_days == float('inf'):
            predicted_date = "Never (Negative or Zero Savings)"
            on_track = False
        else:
            completion_date = today_date + timedelta(days=predicted_days)
            predicted_date = completion_date.strftime("%Y-%m-%d")
            on_track = completion_date <= datetime.strptime(goal_deadline, "%Y-%m-%d")

        # Smart Recommendations & Required Savings
        suggested_cut = 0
        required_daily_savings = 0.0
        
        days_remaining = (datetime.strptime(goal_deadline, "%Y-%m-%d") - today_date).days
        if days_remaining > 0:
            required_daily_savings = remaining_amount / days_remaining
            # If off track, suggest cut
            if not on_track:
                suggested_cut = required_daily_savings - avg_daily_savings
                if suggested_cut < 0: suggested_cut = 0
        else:
             suggested_cut = remaining_amount
             required_daily_savings = remaining_amount # Deadline passed/today, need everything immediately
        
        return {
            "predicted_completion_date": predicted_date,
            "daily_savings_estimate": round(avg_daily_savings, 2),
            "required_daily_savings": round(required_daily_savings, 2), # Return strictly calculated value
            "on_track": on_track,
            "suggested_daily_cut": round(suggested_cut, 2)
        }

    except Exception as e:
        logger.error(f"Prediction error: {str(e)}", exc_info=True)
        return {
            "predicted_completion_date": None,
            "daily_savings_estimate": 0,
            "on_track": False,
            "suggested_daily_cut": 0,
            "error": str(e)
        }
