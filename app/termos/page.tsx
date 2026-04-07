import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Termos de Uso — Charlotte AI',
  description: 'Termos de Uso do aplicativo Charlotte AI, desenvolvido pela Hub Academy.',
  robots: { index: true, follow: true },
};

export default function TermosPage() {
  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px', fontFamily: 'Georgia, serif', color: '#1a1a1a', lineHeight: 1.8 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, fontFamily: 'system-ui, sans-serif' }}>Termos de Uso</h1>
      <p style={{ color: '#666', fontSize: 14, marginBottom: 40, fontFamily: 'system-ui, sans-serif' }}>
        Última atualização: 07 de abril de 2026
      </p>

      <Section title="1. Aceitação dos Termos">
        <p>
          Ao baixar, instalar ou utilizar o aplicativo <strong>Charlotte AI</strong> ("Aplicativo"), você ("Usuário") concorda com estes Termos de Uso ("Termos"). Se não concordar com qualquer disposição, não utilize o Aplicativo.
        </p>
        <p>
          O Aplicativo é desenvolvido e operado pela <strong>Hub Academy</strong> ("nós", "nosso"). Contato: <a href="mailto:suporte@hubacademy.com.br" style={{ color: '#7c3aed' }}>suporte@hubacademy.com.br</a>.
        </p>
      </Section>

      <Section title="2. Descrição do Serviço">
        <p>
          Charlotte AI é um assistente de aprendizado de inglês com inteligência artificial que oferece:
        </p>
        <ul>
          <li>Conversas em tempo real com IA para prática de inglês;</li>
          <li>Lições interativas de gramática, pronúncia e vocabulário;</li>
          <li>Sistema de progresso gamificado com streaks e níveis;</li>
          <li>Criação de flashcards com câmera do dispositivo;</li>
          <li>Funcionalidades premium disponíveis mediante assinatura.</li>
        </ul>
      </Section>

      <Section title="3. Elegibilidade">
        <p>
          Para utilizar o Aplicativo, você deve:
        </p>
        <ul>
          <li>Ter <strong>13 anos de idade ou mais</strong>;</li>
          <li>Usuários entre 13 e 17 anos devem ter autorização dos pais ou responsáveis legais;</li>
          <li>Possuir capacidade legal para celebrar contratos vinculantes em sua jurisdição;</li>
          <li>Não estar proibido de usar o Aplicativo por lei aplicável.</li>
        </ul>
      </Section>

      <Section title="4. Conta de Usuário">
        <p>
          Para acessar o Aplicativo, você deve criar uma conta fornecendo nome e e-mail válido. Você é responsável por:
        </p>
        <ul>
          <li>Manter a confidencialidade da sua senha;</li>
          <li>Todas as atividades realizadas em sua conta;</li>
          <li>Notificar-nos imediatamente em caso de uso não autorizado da sua conta.</li>
        </ul>
        <p>
          É vedada a criação de contas falsas, a representação de terceiros ou o uso de dados de outras pessoas.
        </p>
      </Section>

      <Section title="5. Assinaturas e Pagamentos">
        <p>
          O Charlotte AI oferece planos gratuito e premium. As assinaturas premium são processadas pela <strong>Apple App Store</strong> (iOS) ou <strong>Google Play Store</strong> (Android), sujeitas às respectivas políticas de pagamento.
        </p>
        <ul>
          <li><strong>Cobrança:</strong> A assinatura é cobrada automaticamente no início de cada período (mensal ou anual) até o cancelamento;</li>
          <li><strong>Período de teste gratuito:</strong> Quando oferecido, o período de trial é convertido automaticamente em assinatura paga ao término, salvo cancelamento antes do encerramento;</li>
          <li><strong>Cancelamento:</strong> Pode ser feito a qualquer momento nas configurações da App Store ou Google Play. O acesso premium permanece ativo até o fim do período já pago;</li>
          <li><strong>Reembolsos:</strong> Regidos pelas políticas da Apple ou Google, conforme aplicável. Pedidos de reembolso devem ser solicitados diretamente às plataformas;</li>
          <li><strong>Preços:</strong> Sujeitos a alteração com aviso prévio razoável.</li>
        </ul>
      </Section>

      <Section title="6. Uso Aceitável">
        <p>Você concorda em utilizar o Aplicativo apenas para fins legítimos de aprendizado. É estritamente proibido:</p>
        <ul>
          <li>Usar o Aplicativo para fins ilegais, difamatórios, abusivos ou prejudiciais;</li>
          <li>Tentar fazer engenharia reversa, descompilar ou modificar o Aplicativo;</li>
          <li>Utilizar bots, scripts ou automações não autorizadas;</li>
          <li>Compartilhar sua conta com terceiros;</li>
          <li>Reproduzir, distribuir ou explorar comercialmente o conteúdo do Aplicativo sem autorização;</li>
          <li>Interferir na operação ou segurança do Aplicativo ou de seus servidores;</li>
          <li>Contornar medidas de controle de acesso ao conteúdo premium.</li>
        </ul>
      </Section>

      <Section title="7. Conteúdo Gerado por IA">
        <p>
          O Charlotte AI utiliza inteligência artificial (incluindo modelos da OpenAI) para gerar respostas e conteúdo educacional. Você reconhece que:
        </p>
        <ul>
          <li>O conteúdo gerado pela IA é para fins educacionais e pode conter imprecisões;</li>
          <li>As respostas da IA não substituem instrução profissional de idiomas;</li>
          <li>Não nos responsabilizamos por decisões tomadas com base exclusivamente no conteúdo gerado pela IA;</li>
          <li>Conversas com a IA podem ser utilizadas para melhorar o serviço, conforme nossa Política de Privacidade.</li>
        </ul>
      </Section>

      <Section title="8. Propriedade Intelectual">
        <p>
          Todo o conteúdo do Aplicativo — incluindo textos, imagens, áudios, algoritmos e software — é de propriedade da Hub Academy ou licenciado por terceiros, protegido por leis de direitos autorais e propriedade intelectual.
        </p>
        <p>
          Concedemos a você uma licença limitada, não exclusiva, intransferível e revogável para uso pessoal e não comercial do Aplicativo.
        </p>
        <p>
          Os <strong>flashcards e conteúdo</strong> criados por você no Aplicativo pertencem a você. Ao criar conteúdo, você nos concede licença para armazená-lo e exibi-lo em sua conta.
        </p>
      </Section>

      <Section title="9. Disponibilidade e Modificações">
        <p>
          Nos reservamos o direito de, a qualquer momento e sem aviso prévio:
        </p>
        <ul>
          <li>Modificar, suspender ou encerrar o Aplicativo ou funcionalidades específicas;</li>
          <li>Atualizar estes Termos de Uso (notificaremos sobre alterações significativas);</li>
          <li>Encerrar contas que violem estes Termos.</li>
        </ul>
        <p>
          Não garantimos disponibilidade ininterrupta do serviço.
        </p>
      </Section>

      <Section title="10. Limitação de Responsabilidade">
        <p>
          Na máxima extensão permitida pela lei aplicável:
        </p>
        <ul>
          <li>O Aplicativo é fornecido "no estado em que se encontra" ("as is"), sem garantias de qualquer tipo;</li>
          <li>Não nos responsabilizamos por danos indiretos, incidentais, especiais ou consequentes;</li>
          <li>Nossa responsabilidade total não excederá o valor pago por você nos últimos 12 meses pelo uso do Aplicativo;</li>
          <li>Não garantimos que o Aplicativo atenderá às suas expectativas específicas de aprendizado.</li>
        </ul>
      </Section>

      <Section title="11. Indenização">
        <p>
          Você concorda em indenizar e isentar a Hub Academy, seus diretores, funcionários e parceiros de quaisquer reclamações, danos, custos ou despesas (incluindo honorários advocatícios) decorrentes do seu uso indevido do Aplicativo ou violação destes Termos.
        </p>
      </Section>

      <Section title="12. Lei Aplicável e Foro">
        <p>
          Estes Termos são regidos pela legislação brasileira. Quaisquer disputas serão submetidas ao foro da Comarca de São Paulo, SP, Brasil, ressalvadas as exceções previstas em lei (incluindo o Código de Defesa do Consumidor).
        </p>
      </Section>

      <Section title="13. Disposições Gerais">
        <ul>
          <li>Se qualquer disposição destes Termos for considerada inválida, as demais permanecerão em plena vigência;</li>
          <li>A omissão no exercício de qualquer direito não constitui renúncia;</li>
          <li>Estes Termos constituem o acordo completo entre você e a Hub Academy em relação ao uso do Aplicativo.</li>
        </ul>
      </Section>

      <Section title="14. Contato">
        <p>
          Para dúvidas sobre estes Termos:
        </p>
        <p>
          <strong>Hub Academy</strong><br />
          E-mail: <a href="mailto:suporte@hubacademy.com.br" style={{ color: '#7c3aed' }}>suporte@hubacademy.com.br</a>
        </p>
      </Section>

      <footer style={{ marginTop: 64, paddingTop: 24, borderTop: '1px solid #e5e7eb', fontSize: 13, color: '#9ca3af', fontFamily: 'system-ui, sans-serif' }}>
        © 2026 Hub Academy. Todos os direitos reservados.<br />
        <a href="/privacidade" style={{ color: '#7c3aed' }}>Política de Privacidade</a>
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
