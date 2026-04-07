import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de Privacidade — Charlotte AI',
  description: 'Política de Privacidade do aplicativo Charlotte AI, desenvolvido pela Hub Academy.',
  robots: { index: true, follow: true },
};

export default function PrivacidadePage() {
  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px', fontFamily: 'Georgia, serif', color: '#1a1a1a', lineHeight: 1.8 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, fontFamily: 'system-ui, sans-serif' }}>Política de Privacidade</h1>
      <p style={{ color: '#666', fontSize: 14, marginBottom: 40, fontFamily: 'system-ui, sans-serif' }}>
        Última atualização: 07 de abril de 2026
      </p>

      <Section title="1. Quem somos">
        <p>
          O aplicativo <strong>Charlotte AI</strong> é desenvolvido e operado pela <strong>Hub Academy</strong> ("nós", "nosso"). Este documento descreve como coletamos, usamos, armazenamos e protegemos as informações pessoais dos usuários ("você"), em conformidade com a <strong>Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018)</strong> e demais normas aplicáveis.
        </p>
        <p>
          Contato do controlador de dados:<br />
          <strong>Hub Academy</strong><br />
          E-mail: <a href="mailto:privacidade@hubacademy.com.br" style={{ color: '#7c3aed' }}>privacidade@hubacademy.com.br</a>
        </p>
      </Section>

      <Section title="2. Dados coletados">
        <p>Coletamos as seguintes categorias de dados pessoais:</p>
        <ul>
          <li><strong>Dados de cadastro:</strong> nome, endereço de e-mail e senha (armazenada com hash seguro).</li>
          <li><strong>Dados de uso:</strong> histórico de conversas com a IA, progresso nas lições, streak diário, nível de inglês e preferências de aprendizado.</li>
          <li><strong>Dados de áudio:</strong> gravações de voz capturadas durante sessões de prática de conversação. O áudio é processado em tempo real e não é armazenado de forma permanente em nossos servidores.</li>
          <li><strong>Dados de câmera:</strong> imagens capturadas pelo usuário para criação de flashcards de vocabulário. As imagens são processadas para geração de conteúdo e podem ser armazenadas na conta do usuário.</li>
          <li><strong>Dados de dispositivo:</strong> token de notificações push, sistema operacional e versão do aplicativo (para envio de lembretes de estudo).</li>
          <li><strong>Dados de pagamento:</strong> processados exclusivamente pela plataforma <strong>RevenueCat / App Store / Google Play</strong>. Não armazenamos dados de cartão de crédito ou informações bancárias.</li>
        </ul>
      </Section>

      <Section title="3. Finalidade do tratamento">
        <p>Tratamos seus dados pessoais para as seguintes finalidades:</p>
        <ul>
          <li>Criação e gestão da sua conta de usuário;</li>
          <li>Personalização da experiência de aprendizado com base no seu nível e progresso;</li>
          <li>Processamento de comandos de voz e geração de respostas pela IA;</li>
          <li>Envio de notificações de lembrete de estudo (apenas com sua autorização);</li>
          <li>Processamento de assinaturas premium;</li>
          <li>Cumprimento de obrigações legais e regulatórias;</li>
          <li>Melhoria contínua do serviço e segurança da plataforma.</li>
        </ul>
      </Section>

      <Section title="4. Base legal">
        <p>O tratamento dos seus dados é fundamentado nas seguintes bases legais previstas na LGPD:</p>
        <ul>
          <li><strong>Execução de contrato</strong> (art. 7º, V): para criação de conta, uso do aplicativo e processamento de pagamentos;</li>
          <li><strong>Consentimento</strong> (art. 7º, I): para envio de notificações push e uso de câmera/microfone;</li>
          <li><strong>Legítimo interesse</strong> (art. 7º, IX): para melhorias de segurança e personalização do serviço;</li>
          <li><strong>Cumprimento de obrigação legal</strong> (art. 7º, II): quando exigido por lei ou autoridade competente.</li>
        </ul>
      </Section>

      <Section title="5. Compartilhamento de dados">
        <p>Não vendemos seus dados pessoais. Podemos compartilhar informações com terceiros apenas nas seguintes situações:</p>
        <ul>
          <li><strong>Supabase:</strong> plataforma de banco de dados e autenticação (dados armazenados em servidores seguros);</li>
          <li><strong>OpenAI / ElevenLabs:</strong> processamento de linguagem natural e síntese de voz para as conversas com a IA Charlotte;</li>
          <li><strong>RevenueCat:</strong> gestão de assinaturas e pagamentos;</li>
          <li><strong>Apple / Google:</strong> distribuição do aplicativo e processamento de compras in-app;</li>
          <li><strong>Autoridades públicas:</strong> quando exigido por lei, ordem judicial ou processo legal.</li>
        </ul>
        <p>Todos os prestadores de serviço são contratualmente obrigados a proteger seus dados e utilizá-los apenas para as finalidades contratadas.</p>
      </Section>

      <Section title="6. Retenção de dados">
        <p>
          Mantemos seus dados pessoais pelo tempo necessário para a prestação do serviço e cumprimento de obrigações legais:
        </p>
        <ul>
          <li>Dados de conta: enquanto a conta estiver ativa ou por até 5 anos após o encerramento;</li>
          <li>Histórico de conversas: armazenado enquanto a conta estiver ativa;</li>
          <li>Gravações de voz: não são armazenadas de forma permanente — processadas em tempo real e descartadas;</li>
          <li>Dados de pagamento: conforme os prazos legais e contratuais exigidos (geralmente 5 anos).</li>
        </ul>
      </Section>

      <Section title="7. Seus direitos (LGPD)">
        <p>Nos termos da LGPD, você possui os seguintes direitos em relação aos seus dados pessoais:</p>
        <ul>
          <li>Confirmação da existência de tratamento;</li>
          <li>Acesso aos dados;</li>
          <li>Correção de dados incompletos, inexatos ou desatualizados;</li>
          <li>Anonimização, bloqueio ou eliminação de dados desnecessários;</li>
          <li>Portabilidade dos dados a outro fornecedor;</li>
          <li>Eliminação dos dados tratados com base em consentimento;</li>
          <li>Informação sobre o compartilhamento com terceiros;</li>
          <li>Revogação do consentimento a qualquer momento.</li>
        </ul>
        <p>
          Para exercer seus direitos, entre em contato: <a href="mailto:privacidade@hubacademy.com.br" style={{ color: '#7c3aed' }}>privacidade@hubacademy.com.br</a>.<br />
          Responderemos no prazo de 15 dias úteis.
        </p>
      </Section>

      <Section title="8. Segurança">
        <p>
          Adotamos medidas técnicas e organizacionais para proteger seus dados contra acesso não autorizado, perda ou destruição, incluindo:
        </p>
        <ul>
          <li>Criptografia de dados em trânsito (TLS/HTTPS) e em repouso;</li>
          <li>Autenticação segura via Supabase Auth;</li>
          <li>Armazenamento de senhas com hash (nunca em texto plano);</li>
          <li>Acesso restrito aos dados por equipe autorizada.</li>
        </ul>
      </Section>

      <Section title="9. Crianças e adolescentes">
        <p>
          O Charlotte AI é destinado a usuários com <strong>13 anos de idade ou mais</strong>. Não coletamos intencionalmente dados de crianças menores de 13 anos. Se você acredita que coletamos dados de uma criança, entre em contato conosco para exclusão imediata.
        </p>
      </Section>

      <Section title="10. Alterações nesta política">
        <p>
          Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos sobre mudanças significativas por e-mail ou notificação no aplicativo. O uso continuado após as alterações constitui concordância com a nova versão.
        </p>
      </Section>

      <Section title="11. Contato e DPO">
        <p>
          Para dúvidas, solicitações ou reclamações relacionadas à privacidade:
        </p>
        <p>
          <strong>Hub Academy — Encarregado de Dados (DPO)</strong><br />
          E-mail: <a href="mailto:privacidade@hubacademy.com.br" style={{ color: '#7c3aed' }}>privacidade@hubacademy.com.br</a>
        </p>
        <p>
          Você também pode apresentar reclamação à <strong>Autoridade Nacional de Proteção de Dados (ANPD)</strong>: <a href="https://www.gov.br/anpd" target="_blank" rel="noopener noreferrer" style={{ color: '#7c3aed' }}>www.gov.br/anpd</a>.
        </p>
      </Section>

      <footer style={{ marginTop: 64, paddingTop: 24, borderTop: '1px solid #e5e7eb', fontSize: 13, color: '#9ca3af', fontFamily: 'system-ui, sans-serif' }}>
        © 2026 Hub Academy. Todos os direitos reservados.<br />
        <a href="/termos" style={{ color: '#7c3aed' }}>Termos de Uso</a>
      </footer>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 36 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, fontFamily: 'system-ui, sans-serif', color: '#111827' }}>{title}</h2>
      <div style={{ fontSize: 15, color: '#374151' }}>{children}</div>
    </section>
  );
}
