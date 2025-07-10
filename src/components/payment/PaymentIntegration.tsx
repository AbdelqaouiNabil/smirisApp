import React, { useState } from 'react'
import { Button } from '../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { RadioGroup, RadioGroupItem } from '../ui/radio-group'
import { Label } from '../ui/label'
import { Input } from '../ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { CreditCard, Banknote, Globe, Shield, CheckCircle } from 'lucide-react'
import { FaPaypal, FaCreditCard, FaUniversity } from 'react-icons/fa'

interface PaymentMethod {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  currencies: string[]
  processingTime: string
  fees: string
  isAvailable: boolean
  region: 'international' | 'morocco' | 'europe'
}

interface PaymentIntegrationProps {
  amount: number
  currency: string
  onPaymentSuccess: (paymentData: any) => void
  onPaymentError: (error: string) => void
}

export const PaymentIntegration: React.FC<PaymentIntegrationProps> = ({
  amount,
  currency,
  onPaymentSuccess,
  onPaymentError
}) => {
  const [selectedMethod, setSelectedMethod] = useState<string>('stripe')
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentData, setPaymentData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
    email: '',
    phone: ''
  })

  const paymentMethods: PaymentMethod[] = [
    {
      id: 'stripe',
      name: 'Kreditkarte (Stripe)',
      description: 'Visa, Mastercard, American Express',
      icon: <CreditCard className="h-5 w-5" />,
      currencies: ['EUR', 'USD', 'MAD'],
      processingTime: 'Sofort',
      fees: '2.9% + 0.30€',
      isAvailable: true,
      region: 'international'
    },
    {
      id: 'paypal',
      name: 'PayPal',
      description: 'Bezahlen Sie sicher mit PayPal',
      icon: <FaPaypal className="h-5 w-5 text-blue-600" />,
      currencies: ['EUR', 'USD', 'MAD'],
      processingTime: 'Sofort',
      fees: '3.4% + 0.35€',
      isAvailable: true,
      region: 'international'
    },
    {
      id: 'cmi',
      name: 'CMI (Credit du Maroc)',
      description: 'Marokkanische Bankkarten und Online-Banking',
      icon: <FaUniversity className="h-5 w-5 text-green-600" />,
      currencies: ['MAD'],
      processingTime: '1-2 Werktage',
      fees: '2.5% + 5 MAD',
      isAvailable: true,
      region: 'morocco'
    },
    {
      id: 'wafacash',
      name: 'Wafa Cash',
      description: 'Mobile Payment und Cash-Transfer',
      icon: <Banknote className="h-5 w-5 text-orange-600" />,
      currencies: ['MAD'],
      processingTime: 'Sofort bis 30 Min.',
      fees: '1.5% + 10 MAD',
      isAvailable: true,
      region: 'morocco'
    },
    {
      id: 'bank_transfer',
      name: 'Banküberweisung',
      description: 'Direkte Überweisung (SEPA/SWIFT)',
      icon: <FaUniversity className="h-5 w-5 text-gray-600" />,
      currencies: ['EUR', 'MAD'],
      processingTime: '1-3 Werktage',
      fees: '0% (Bankgebühren können anfallen)',
      isAvailable: true,
      region: 'europe'
    }
  ]

  const handlePayment = async () => {
    setIsProcessing(true)
    
    try {
      switch (selectedMethod) {
        case 'stripe':
          await processStripePayment()
          break
        case 'paypal':
          await processPayPalPayment()
          break
        case 'cmi':
          await processCMIPayment()
          break
        case 'wafacash':
          await processWafaCashPayment()
          break
        case 'bank_transfer':
          await processBankTransfer()
          break
        default:
          throw new Error('Unbekannte Zahlungsmethode')
      }
    } catch (error) {
      onPaymentError(error instanceof Error ? error.message : 'Zahlungsfehler')
    } finally {
      setIsProcessing(false)
    }
  }

  const processStripePayment = async () => {
    // Simulate Stripe payment processing
    console.log('Processing Stripe payment...')
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const paymentResult = {
      paymentId: 'stripe_' + Math.random().toString(36).substr(2, 9),
      method: 'stripe',
      amount,
      currency,
      status: 'completed',
      transactionId: 'txn_stripe_' + Date.now(),
      timestamp: new Date().toISOString()
    }
    
    onPaymentSuccess(paymentResult)
  }

  const processPayPalPayment = async () => {
    // Simulate PayPal payment processing
    console.log('Processing PayPal payment...')
    await new Promise(resolve => setTimeout(resolve, 2500))
    
    const paymentResult = {
      paymentId: 'paypal_' + Math.random().toString(36).substr(2, 9),
      method: 'paypal',
      amount,
      currency,
      status: 'completed',
      transactionId: 'PAYID-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
      timestamp: new Date().toISOString()
    }
    
    onPaymentSuccess(paymentResult)
  }

  const processCMIPayment = async () => {
    // Simulate CMI payment processing
    console.log('Processing CMI payment...')
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    const paymentResult = {
      paymentId: 'cmi_' + Math.random().toString(36).substr(2, 9),
      method: 'cmi',
      amount,
      currency: 'MAD',
      status: 'pending', // CMI might take longer to confirm
      transactionId: 'CMI' + Date.now(),
      timestamp: new Date().toISOString(),
      note: 'Zahlung wird in 1-2 Werktagen bestätigt'
    }
    
    onPaymentSuccess(paymentResult)
  }

  const processWafaCashPayment = async () => {
    // Simulate Wafa Cash payment processing
    console.log('Processing Wafa Cash payment...')
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    const paymentResult = {
      paymentId: 'wafa_' + Math.random().toString(36).substr(2, 9),
      method: 'wafacash',
      amount,
      currency: 'MAD',
      status: 'completed',
      transactionId: 'WF' + Date.now(),
      timestamp: new Date().toISOString(),
      referenceCode: Math.random().toString(36).substr(2, 8).toUpperCase()
    }
    
    onPaymentSuccess(paymentResult)
  }

  const processBankTransfer = async () => {
    // Simulate bank transfer processing
    console.log('Processing bank transfer...')
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const paymentResult = {
      paymentId: 'bank_' + Math.random().toString(36).substr(2, 9),
      method: 'bank_transfer',
      amount,
      currency,
      status: 'pending',
      transactionId: 'BT' + Date.now(),
      timestamp: new Date().toISOString(),
      bankDetails: {
        iban: 'DE89 3704 0044 0532 0130 00',
        bic: 'COBADEFFXXX',
        reference: 'REF' + Date.now()
      }
    }
    
    onPaymentSuccess(paymentResult)
  }

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  const selectedMethodData = paymentMethods.find(m => m.id === selectedMethod)

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Payment Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Zahlungsübersicht
          </CardTitle>
          <CardDescription>
            Sicherer Checkout mit SSL-Verschlüsselung
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center text-lg font-semibold">
            <span>Gesamtbetrag:</span>
            <span className="text-blue-600">{formatAmount(amount, currency)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Payment Methods */}
      <Card>
        <CardHeader>
          <CardTitle>Zahlungsmethode wählen</CardTitle>
          <CardDescription>
            Wählen Sie Ihre bevorzugte Zahlungsmethode
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup value={selectedMethod} onValueChange={setSelectedMethod}>
            {paymentMethods.map((method) => (
              <div key={method.id} className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50">
                <RadioGroupItem value={method.id} id={method.id} />
                <div className="flex-1">
                  <Label htmlFor={method.id} className="flex items-center gap-3 cursor-pointer">
                    {method.icon}
                    <div>
                      <div className="font-medium">{method.name}</div>
                      <div className="text-sm text-gray-500">{method.description}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        {method.processingTime} • {method.fees}
                      </div>
                    </div>
                  </Label>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500">
                    {method.currencies.join(', ')}
                  </div>
                  {method.isAvailable ? (
                    <CheckCircle className="h-4 w-4 text-green-500 mt-1" />
                  ) : (
                    <div className="text-xs text-red-500">Nicht verfügbar</div>
                  )}
                </div>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Payment Form */}
      {selectedMethodData && (
        <Card>
          <CardHeader>
            <CardTitle>Zahlungsinformationen</CardTitle>
            <CardDescription>
              {selectedMethodData.name} - {selectedMethodData.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {(selectedMethod === 'stripe' || selectedMethod === 'cmi') && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cardNumber">Kartennummer</Label>
                    <Input
                      id="cardNumber"
                      placeholder="1234 5678 9012 3456"
                      value={paymentData.cardNumber}
                      onChange={(e) => setPaymentData({...paymentData, cardNumber: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="cardholderName">Karteninhaber</Label>
                    <Input
                      id="cardholderName"
                      placeholder="Max Mustermann"
                      value={paymentData.cardholderName}
                      onChange={(e) => setPaymentData({...paymentData, cardholderName: e.target.value})}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="expiryDate">Ablaufdatum</Label>
                    <Input
                      id="expiryDate"
                      placeholder="MM/YY"
                      value={paymentData.expiryDate}
                      onChange={(e) => setPaymentData({...paymentData, expiryDate: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="cvv">CVV</Label>
                    <Input
                      id="cvv"
                      placeholder="123"
                      value={paymentData.cvv}
                      onChange={(e) => setPaymentData({...paymentData, cvv: e.target.value})}
                    />
                  </div>
                </div>
              </>
            )}

            {selectedMethod === 'wafacash' && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="phone">Telefonnummer</Label>
                  <Input
                    id="phone"
                    placeholder="+212 6XX XXXXXX"
                    value={paymentData.phone}
                    onChange={(e) => setPaymentData({...paymentData, phone: e.target.value})}
                  />
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <p className="text-sm text-orange-800">
                    Sie erhalten eine SMS mit dem Bestätigungscode für Ihre Wafa Cash Zahlung.
                  </p>
                </div>
              </div>
            )}

            {selectedMethod === 'bank_transfer' && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Überweisungsdetails:</h4>
                <div className="text-sm space-y-1">
                  <p><strong>IBAN:</strong> DE89 3704 0044 0532 0130 00</p>
                  <p><strong>BIC:</strong> COBADEFFXXX</p>
                  <p><strong>Verwendungszweck:</strong> REF{Date.now()}</p>
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="email">E-Mail-Adresse</Label>
              <Input
                id="email"
                type="email"
                placeholder="ihre@email.com"
                value={paymentData.email}
                onChange={(e) => setPaymentData({...paymentData, email: e.target.value})}
              />
            </div>

            <Button
              onClick={handlePayment}
              disabled={isProcessing}
              className="w-full"
              size="lg"
            >
              {isProcessing ? (
                'Zahlung wird verarbeitet...'
              ) : (
                `${formatAmount(amount, currency)} bezahlen`
              )}
            </Button>

            <div className="text-xs text-gray-500 text-center">
              Durch die Zahlung akzeptieren Sie unsere AGB und Datenschutzerklärung.
              Ihre Daten werden SSL-verschlüsselt übertragen.
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Payment Service for backend integration
export class PaymentService {
  private static instance: PaymentService
  private stripePublicKey: string = process.env.REACT_APP_STRIPE_PUBLIC_KEY || 'pk_test_demo'
  private paypalClientId: string = process.env.REACT_APP_PAYPAL_CLIENT_ID || 'demo-paypal-client'

  public static getInstance(): PaymentService {
    if (!PaymentService.instance) {
      PaymentService.instance = new PaymentService()
    }
    return PaymentService.instance
  }

  async createPaymentIntent(amount: number, currency: string, method: string) {
    const response = await fetch('/api/payments/create-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        amount,
        currency,
        payment_method: method
      })
    })

    if (!response.ok) {
      throw new Error('Payment intent creation failed')
    }

    return response.json()
  }

  async confirmPayment(paymentIntentId: string, paymentData: any) {
    const response = await fetch('/api/payments/confirm', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        payment_intent_id: paymentIntentId,
        payment_data: paymentData
      })
    })

    if (!response.ok) {
      throw new Error('Payment confirmation failed')
    }

    return response.json()
  }
}

export default PaymentIntegration
