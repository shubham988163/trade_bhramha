#!/usr/bin/env python3
"""
PCR Calculation from Fyers API - Exact Specification Implementation
=================================================================

Fyers API Call:
fyers.optionchain(data={"symbol":"NSE:NIFTY50-INDEX","strikecount":20,"timestamp":""})

Response Structure:
{
  "s": "ok",  # or "error" on token expiry
  "data": {
    "optionsChain": [
      {
        "option_type": "CE" or "PE",  # Call or Put
        "oi": 2500000,                 # Open Interest
        "strike_price": 24600,
        ... other fields
      },
      ...
    ]
  }
}

PCR Calculation Logic:
1. Sum OI for all CE (Call) entries = total_call_oi
2. Sum OI for all PE (Put) entries = total_put_oi
3. PCR = total_put_oi / total_call_oi
4. Signal:
   - PCR > 1.3: BULLISH (extreme put buying)
   - PCR < 0.7: BEARISH (extreme call buying)
   - 0.7 <= PCR <= 1.3: NEUTRAL
"""

import time
from typing import Dict, List, Optional, Tuple

class FyersPCRCalculator:
    """Calculate PCR from Fyers option chain endpoint"""
    
    def __init__(self, fyers_client=None):
        """
        Initialize with Fyers client
        
        Args:
            fyers_client: Fyers API client instance
        """
        self.fyers = fyers_client
        self.last_pcr = None
        self.last_call_oi = None
        self.last_put_oi = None
    
    def calculate_pcr_from_response(self, response: Dict) -> Optional[Tuple[float, str, int, int]]:
        """
        Calculate PCR from Fyers API response
        
        Args:
            response: Response from fyers.optionchain()
        
        Returns:
            Tuple of (pcr, signal, total_call_oi, total_put_oi) or None on error
        """
        try:
            # Check for API errors (token expiry, etc.)
            if response.get('s') == 'error':
                print(f"❌ Fyers API Error: {response.get('message', 'Unknown error')}")
                return None
            
            if response.get('s') != 'ok':
                print(f"❌ Invalid response status: {response.get('s')}")
                return None
            
            # Extract option chain data
            option_chain = response.get('data', {}).get('optionsChain', [])
            
            if not option_chain:
                print("❌ No option chain data in response")
                return None
            
            # Sum OI separately for CE and PE
            total_call_oi = 0
            total_put_oi = 0
            
            for option in option_chain:
                option_type = option.get('option_type', '').upper()
                oi = option.get('oi', 0)
                strike = option.get('strike_price', 0)
                
                if option_type == 'CE':  # Call
                    total_call_oi += oi
                    print(f"  CE {strike}: OI = {oi:>10,}")
                
                elif option_type == 'PE':  # Put
                    total_put_oi += oi
                    print(f"  PE {strike}: OI = {oi:>10,}")
            
            # Safety check: division by zero
            if total_call_oi == 0:
                print("❌ Total Call OI is 0 - cannot calculate PCR")
                return None
            
            # Calculate PCR
            pcr = total_put_oi / total_call_oi
            
            # Determine signal
            if pcr > 1.3:
                signal = "BULLISH (Extreme put buying - High hedging)"
            elif pcr < 0.7:
                signal = "BEARISH (Extreme call buying - High aggression)"
            else:
                signal = "NEUTRAL (Balanced positioning)"
            
            # Store for reference
            self.last_pcr = pcr
            self.last_call_oi = total_call_oi
            self.last_put_oi = total_put_oi
            
            return pcr, signal, total_call_oi, total_put_oi
        
        except Exception as e:
            print(f"❌ Exception in PCR calculation: {e}")
            return None
    
    def fetch_and_calculate_pcr(self, symbol: str = "NSE:NIFTY50-INDEX", 
                               strikecount: int = 20) -> Optional[Tuple[float, str, int, int]]:
        """
        Fetch option chain from Fyers and calculate PCR
        
        Args:
            symbol: Option symbol (default: NIFTY 50)
            strikecount: Number of strikes around ATM
        
        Returns:
            Tuple of (pcr, signal, total_call_oi, total_put_oi) or None on error
        """
        if not self.fyers:
            print("❌ Fyers client not initialized")
            return None
        
        try:
            print(f"\n📊 Fetching option chain for {symbol} ({strikecount} strikes)...")
            
            # Call Fyers API
            response = self.fyers.optionchain(
                data={
                    "symbol": symbol,
                    "strikecount": strikecount,
                    "timestamp": ""
                }
            )
            
            print(f"API Response Status: {response.get('s')}")
            
            # Calculate PCR from response
            result = self.calculate_pcr_from_response(response)
            
            if result:
                pcr, signal, total_call_oi, total_put_oi = result
                self.print_results(pcr, signal, total_call_oi, total_put_oi)
            
            return result
        
        except Exception as e:
            print(f"❌ Error fetching option chain: {e}")
            return None
    
    def print_results(self, pcr: float, signal: str, total_call_oi: int, total_put_oi: int):
        """Print formatted PCR results"""
        print("\n" + "="*60)
        print("PCR CALCULATION RESULTS")
        print("="*60)
        print(f"Total Call OI (CE): {total_call_oi:>15,} contracts")
        print(f"Total Put OI (PE):  {total_put_oi:>15,} contracts")
        print("-"*60)
        print(f"PCR = Put OI / Call OI")
        print(f"PCR = {total_put_oi:,} / {total_call_oi:,}")
        print(f"PCR = {pcr:.2f}")
        print("-"*60)
        print(f"Signal: {signal}")
        print("="*60 + "\n")
    
    def start_live_tracking(self, symbol: str = "NSE:NIFTY50-INDEX", 
                          strikecount: int = 20,
                          interval_seconds: int = 60,
                          max_iterations: Optional[int] = None):
        """
        Live PCR tracking every N seconds
        
        Args:
            symbol: Option symbol
            strikecount: Number of strikes
            interval_seconds: Seconds between updates
            max_iterations: Max updates (None = infinite)
        """
        print(f"\n🔄 Starting live PCR tracking (every {interval_seconds}s)")
        print("Press Ctrl+C to stop\n")
        
        iteration = 0
        while True:
            try:
                iteration += 1
                print(f"[{iteration}] {time.strftime('%Y-%m-%d %H:%M:%S')} - Fetching PCR...")
                
                result = self.fetch_and_calculate_pcr(symbol, strikecount)
                
                if max_iterations and iteration >= max_iterations:
                    print(f"Reached max iterations ({max_iterations}). Stopping.")
                    break
                
                if result:
                    print(f"Waiting {interval_seconds}s until next update...")
                    time.sleep(interval_seconds)
                else:
                    print(f"Error occurred. Retrying in {interval_seconds}s...")
                    time.sleep(interval_seconds)
            
            except KeyboardInterrupt:
                print("\n\n⏹️  Live tracking stopped by user")
                break
            except Exception as e:
                print(f"❌ Unexpected error in tracking loop: {e}")
                time.sleep(interval_seconds)


# Example Usage (when Fyers client is available)
def example_with_mock_data():
    """
    Example with mock Fyers API response
    Demonstrates exact calculation as per specification
    """
    print("\n" + "="*60)
    print("EXAMPLE: PCR Calculation with Mock Fyers Response")
    print("="*60 + "\n")
    
    # Mock response matching Fyers API structure
    mock_response = {
        "s": "ok",
        "data": {
            "optionsChain": [
                # CALLS (CE)
                {"option_type": "CE", "strike_price": 24400, "oi": 400000},
                {"option_type": "CE", "strike_price": 24450, "oi": 900000},
                {"option_type": "CE", "strike_price": 24500, "oi": 1400000},
                {"option_type": "CE", "strike_price": 24550, "oi": 1900000},
                {"option_type": "CE", "strike_price": 24600, "oi": 2500000},
                {"option_type": "CE", "strike_price": 24650, "oi": 2300000},
                {"option_type": "CE", "strike_price": 24700, "oi": 1900000},
                {"option_type": "CE", "strike_price": 24750, "oi": 1400000},
                {"option_type": "CE", "strike_price": 24800, "oi": 900000},
                {"option_type": "CE", "strike_price": 24850, "oi": 400000},
                
                # PUTS (PE)
                {"option_type": "PE", "strike_price": 24400, "oi": 420000},
                {"option_type": "PE", "strike_price": 24450, "oi": 950000},
                {"option_type": "PE", "strike_price": 24500, "oi": 1500000},
                {"option_type": "PE", "strike_price": 24550, "oi": 2000000},
                {"option_type": "PE", "strike_price": 24600, "oi": 2600000},
                {"option_type": "PE", "strike_price": 24650, "oi": 2400000},
                {"option_type": "PE", "strike_price": 24700, "oi": 2000000},
                {"option_type": "PE", "strike_price": 24750, "oi": 1500000},
                {"option_type": "PE", "strike_price": 24800, "oi": 950000},
                {"option_type": "PE", "strike_price": 24850, "oi": 420000},
            ]
        }
    }
    
    # Calculate PCR
    calculator = FyersPCRCalculator()
    result = calculator.calculate_pcr_from_response(mock_response)
    
    if result:
        pcr, signal, total_call_oi, total_put_oi = result
        print(f"\n✅ PCR Calculation Successful")
        print(f"   PCR: {pcr:.2f}")
        print(f"   Signal: {signal}")
        print(f"   Call OI: {total_call_oi:,}")
        print(f"   Put OI: {total_put_oi:,}")
    
    return calculator


# Test cases
def run_tests():
    """Run test cases for PCR calculation"""
    print("\n" + "="*60)
    print("TEST CASES FOR PCR CALCULATION")
    print("="*60 + "\n")
    
    # Test 1: Bearish market (high PCR)
    print("TEST 1: Bearish Market (High PCR > 1.3)")
    bearish_response = {
        "s": "ok",
        "data": {
            "optionsChain": [
                {"option_type": "CE", "strike_price": 24600, "oi": 2000000},
                {"option_type": "PE", "strike_price": 24600, "oi": 2700000},
            ]
        }
    }
    calculator = FyersPCRCalculator()
    result = calculator.calculate_pcr_from_response(bearish_response)
    if result:
        pcr, signal, _, _ = result
        print(f"Result: PCR={pcr:.2f} ({signal})\n")
    
    # Test 2: Bullish market (low PCR)
    print("TEST 2: Bullish Market (Low PCR < 0.7)")
    bullish_response = {
        "s": "ok",
        "data": {
            "optionsChain": [
                {"option_type": "CE", "strike_price": 24600, "oi": 3000000},
                {"option_type": "PE", "strike_price": 24600, "oi": 1800000},
            ]
        }
    }
    result = calculator.calculate_pcr_from_response(bullish_response)
    if result:
        pcr, signal, _, _ = result
        print(f"Result: PCR={pcr:.2f} ({signal})\n")
    
    # Test 3: Neutral market
    print("TEST 3: Neutral Market (PCR between 0.7-1.3)")
    neutral_response = {
        "s": "ok",
        "data": {
            "optionsChain": [
                {"option_type": "CE", "strike_price": 24600, "oi": 2500000},
                {"option_type": "PE", "strike_price": 24600, "oi": 2500000},
            ]
        }
    }
    result = calculator.calculate_pcr_from_response(neutral_response)
    if result:
        pcr, signal, _, _ = result
        print(f"Result: PCR={pcr:.2f} ({signal})\n")
    
    # Test 4: API error (token expiry)
    print("TEST 4: API Error (Token Expiry)")
    error_response = {
        "s": "error",
        "message": "Token expired"
    }
    result = calculator.calculate_pcr_from_response(error_response)
    print(f"Result: {result}\n")


if __name__ == "__main__":
    print("\n🔷 Fyers PCR Calculator - Exact API Specification\n")
    
    # Run tests
    run_tests()
    
    # Example with mock data
    calculator = example_with_mock_data()
    
    # Note: Uncomment below when actual Fyers client is available
    # from fyers_apiv3 import fyersModel
    # fyers = fyersModel.FyersModel(client_id="YOUR_CLIENT_ID", is_async=False, token="YOUR_TOKEN")
    # calculator = FyersPCRCalculator(fyers_client=fyers)
    # calculator.start_live_tracking(max_iterations=5)  # Run for 5 updates
