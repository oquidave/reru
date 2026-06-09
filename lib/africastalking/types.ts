// Africa's Talking SMS API response shapes.
// https://developers.africastalking.com/docs/sms/sending/bulk

export interface AfricasTalkingRecipient {
  statusCode: number
  number: string
  status: string
  cost: string
  messageId: string
}

export interface AfricasTalkingSendResponse {
  SMSMessageData: {
    Message: string
    Recipients: AfricasTalkingRecipient[]
  }
}
