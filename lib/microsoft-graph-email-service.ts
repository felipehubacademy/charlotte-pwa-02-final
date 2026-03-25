// lib/microsoft-graph-email-service.ts
// STUB — Microsoft Graph foi removido. Use SimpleEmailService (Resend) no lugar.

export class MicrosoftGraphEmailService {
  static async sendEmail(_to: string, _subject: string, _body: string): Promise<boolean> {
    console.warn('MicrosoftGraphEmailService foi removido. Use SimpleEmailService.');
    return false;
  }
}

export default new MicrosoftGraphEmailService();
