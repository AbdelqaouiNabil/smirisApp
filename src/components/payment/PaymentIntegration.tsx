import React, { useState } from 'react'
import { Button } from '../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { RadioGroup, RadioGroupItem } from '../ui/radio-group'
import { Label } from '../ui/label'
import { Input } from '../ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { CreditCard, Banknote, Globe, Shield, CheckCircle } from 'lucide-react'
import { FaPaypal, FaCreditCard, FaUniversity } from 'react-icons/fa'
import { useToast } from '../../hooks/use-toast'

interface PaymentMethod {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  processingTime: string
  fees: string
}

interface PaymentIntegrationProps {
  amount: number
  currency: string
  bookingId: number
  onPaymentSuccess: (paymentData: any) => void
  onPaymentError: (error: string) => void
}

export const PaymentIntegration: React.FC<PaymentIntegrationProps> = ({
  amount,
  currency,
  bookingId,
  onPaymentSuccess,
  onPaymentError
}) => {
  const { toast } = useToast()
  const [selectedMethod, setSelectedMethod] = useState<string>('card')
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentData, setPaymentData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
    email: ''
  })

  const paymentMethods: PaymentMethod[] = [
    {
      id: 'card',
      name: 'Kreditkarte',
      description: 'Visa, Mastercard, American Express',
      icon: <CreditCard className="h-5 w-5" />,
      processingTime: 'Sofort',
      fees: '2.9% + 0.30€'
    },
    {
      id: 'paypal',
      name: 'PayPal',
      description: 'Bezahlen Sie sicher mit PayPal',
      icon: <FaPaypal className="h-5 w-5 text-blue-600" />,
      processingTime: 'Sofort',
      fees: '3.4% + 0.35€'
    },
    {
      id: 'bank_transfer',
      name: 'Banküberweisung',
      description: 'Direkte Überweisung (SEPA)',
      icon: <FaUniversity className="h-5 w-5 text-gray-600" />,
      processingTime: '1-3 Werktage',
      fees: '0%'
    }
  ]

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPaymentData({
      ...paymentData,
      [e.target.name]: e.target.value
    })
  }

  const validatePaymentData = () => {
    if (selectedMethod === 'card') {
      if (!paymentData.cardNumber || !paymentData.expiryDate || !paymentData.cvv || !paymentData.cardholderName) {
        toast({
          title: "Fehlende Daten",
          description: "Bitte füllen Sie alle Kartenfelder aus",
          variant: "destructive"
        })
        return false
      }
    }
    return true
  }

  const handlePayment = async () => {
    if (!validatePaymentData()) return

    setIsProcessing(true)
    try {
      // 1. Create payment intent
      const createResponse = await fetch('/api/payments/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          booking_id: bookingId,
          payment_method: selectedMethod,
          amount: amount,
          currency: currency
        })
      })

      if (!createResponse.ok) {
        throw new Error('Zahlung konnte nicht initialisiert werden')
      }

      const paymentIntent = await createResponse.json()

      // 2. Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 2000))

      // 3. Confirm payment
      const confirmResponse = await fetch('/api/payments/confirm-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          payment_id: paymentIntent.payment_id,
          transaction_id: paymentIntent.transaction_id
        })
      })

      if (!confirmResponse.ok) {
        throw new Error('Zahlung konnte nicht bestätigt werden')
      }

      const confirmResult = await confirmResponse.json()

      toast({
        title: "Zahlung erfolgreich",
        description: "Ihre Zahlung wurde erfolgreich verarbeitet",
      })

      onPaymentSuccess(confirmResult)
    } catch (error) {
      console.error('Payment error:', error)
      toast({
        title: "Zahlungsfehler",
        description: error instanceof Error ? error.message : 'Ein Fehler ist aufgetreten',
        variant: "destructive"
      })
      onPaymentError(error instanceof Error ? error.message : 'Zahlungsfehler')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>Zahlungsmethode auswählen</CardTitle>
        <CardDescription>Wählen Sie Ihre bevorzugte Zahlungsmethode</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <RadioGroup
            value={selectedMethod}
            onValueChange={setSelectedMethod}
            className="space-y-4"
          >
            {paymentMethods.map((method) => (
              <div key={method.id} className="flex items-center space-x-4 rounded-lg border p-4">
                <RadioGroupItem value={method.id} id={method.id} />
                <Label htmlFor={method.id} className="flex-1 cursor-pointer">
                  <div className="flex items-center space-x-3">
                    {method.icon}
                    <div>
                      <div className="font-medium">{method.name}</div>
                      <div className="text-sm text-gray-500">{method.description}</div>
                      <div className="mt-1 text-xs text-gray-400">
                        Bearbeitungszeit: {method.processingTime} • Gebühren: {method.fees}
                      </div>
                    </div>
                  </div>
                </Label>
              </div>
            ))}
          </RadioGroup>

          {selectedMethod === 'card' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="cardNumber">Kartennummer</Label>
                <Input
                  id="cardNumber"
                  name="cardNumber"
                  placeholder="1234 5678 9012 3456"
                  value={paymentData.cardNumber}
                  onChange={handleInputChange}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1">
                  <Label htmlFor="expiryDate">Gültig bis</Label>
                  <Input
                    id="expiryDate"
                    name="expiryDate"
                    placeholder="MM/YY"
                    value={paymentData.expiryDate}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="col-span-1">
                  <Label htmlFor="cvv">CVV</Label>
                  <Input
                    id="cvv"
                    name="cvv"
                    placeholder="123"
                    value={paymentData.cvv}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="cardholderName">Karteninhaber</Label>
                <Input
                  id="cardholderName"
                  name="cardholderName"
                  placeholder="Max Mustermann"
                  value={paymentData.cardholderName}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          )}

          <div className="pt-4">
            <Button
              onClick={handlePayment}
              disabled={isProcessing}
              className="w-full"
            >
              {isProcessing ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Wird verarbeitet...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4" />
                  <span>{amount} {currency} bezahlen</span>
                </div>
              )}
            </Button>
          </div>

          <div className="text-center text-sm text-gray-500">
            <div className="flex items-center justify-center space-x-2">
              <Shield className="h-4 w-4" />
              <span>Sichere Zahlung</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
