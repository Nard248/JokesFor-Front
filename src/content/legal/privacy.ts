import { DRAFT_NOTICE, type LegalDoc } from './types'

const privacy: LegalDoc = {
  title: 'Privacy Policy',
  lastUpdated: '2026-06-16',
  draftNotice: DRAFT_NOTICE,
  sections: [
    {
      heading: 'Who We Are',
      body: [
        'Jokes For ("we", "us", "our") operates the Jokes For platform, a text-only joke discovery and sharing service.',
        'This Privacy Policy explains how we collect, use, and protect your personal information when you use our service.',
      ],
    },
    {
      heading: 'Information We Collect',
      body: [
        'Account information: When you register, we collect your email address and the username you choose.',
        'Usage data: We may collect information about how you interact with the service, including jokes you view, save, or submit.',
        'Analytics data (with your consent): If you provide consent via our cookie banner and are 18 or older, we use Firebase Analytics to collect aggregated, pseudonymous usage statistics to improve the service.',
        'We do NOT collect payment information, sensitive personal data, or any content beyond text jokes and associated metadata.',
      ],
    },
    {
      heading: 'How We Use Your Information',
      body: [
        'To operate and maintain your account.',
        'To verify your email address and authenticate your identity.',
        'To send you service-related emails (e.g., email verification, password reset).',
        'To improve our service through aggregated analytics, only with your explicit consent.',
        'We never sell your personal data to third parties.',
      ],
    },
    {
      heading: 'Email Verification',
      body: [
        'We require email verification to create an account. We send a one-time code to your email address to confirm it belongs to you.',
        'Verified email addresses are stored in our database and used solely for account management and service communications.',
      ],
    },
    {
      heading: 'Analytics and Cookies',
      body: [
        'We use Firebase Analytics (provided by Google) for optional, consent-based analytics only.',
        'Analytics are activated only when you click "Accept" on our cookie consent banner AND are 18 years of age or older.',
        'If you click "Reject", no analytics data is collected. You can withdraw consent at any time by clearing your browser cookies.',
        'See our Cookie Policy for full details.',
      ],
    },
    {
      heading: 'Data Retention',
      body: [
        'We retain your account information for as long as your account is active.',
        'If you delete your account, we will delete your personal data within 30 days, except where required by law.',
      ],
    },
    {
      heading: 'Your Rights (GDPR and Similar Laws)',
      body: [
        'You have the right to access, correct, or delete your personal data.',
        'You have the right to export your data in a portable format.',
        'You have the right to object to or restrict certain processing activities.',
        'To exercise these rights, please contact us at privacy@jokesfor.com.',
      ],
    },
    {
      heading: 'Children',
      body: [
        'Our service is not directed to children under 13. Users must be at least 13 years old to register.',
        'We do not knowingly collect personal information from children under 13. See our Children\'s Privacy Policy for details.',
      ],
    },
    {
      heading: 'Security',
      body: [
        'We use industry-standard security measures including HTTPS encryption, hashed passwords, and token-based authentication.',
        'No method of transmission over the internet is 100% secure. We strive to protect your data but cannot guarantee absolute security.',
      ],
    },
    {
      heading: 'Contact Us',
      body: [
        'If you have questions about this Privacy Policy, please contact us at privacy@jokesfor.com.',
      ],
    },
  ],
}

export default privacy
