import { DRAFT_NOTICE, type LegalDoc } from './types'

const privacy: LegalDoc = {
  title: 'Privacy Policy',
  lastUpdated: '2026-09-27',
  draftNotice: DRAFT_NOTICE,
  sections: [
    {
      heading: 'Who We Are',
      body: [
        'Jokes For ("we", "us", "our") operates a joke discovery and sharing service with tools for content creators.',
        'This Privacy Policy explains how we collect, use, and protect your personal information when you use our service.',
      ],
    },
    {
      heading: 'Information We Collect',
      body: [
        'Account information: When you register, we collect your email address and the username you choose.',
        'Usage data: We may collect information about how you interact with the service, including jokes you view, save, or submit.',
        'Analytics data (with your consent): If you provide consent via our cookie banner and are 18 or older, we use Firebase Analytics to collect aggregated, pseudonymous usage statistics to improve the service.',
        'Creator audience measurement (with your account opt-in): For signed-in adults, we record eligible joke impressions, reveals, visible reading time and supported media playback, together with event and session identifiers, source screen, platform and timestamps. These records are linked to your account internally; creators receive aggregate insights, not individual audience identities.',
        'Creator workspace data: We store private preparation notes, ordered series and set lists, and metadata requests. Private notes and collections are visible to their owner; metadata requests are also available to authorized reviewers.',
        'Submitted content can include text and supported media. If you subscribe to creator tools, payment processors handle payment collection; we retain the billing identifiers and subscription records needed to manage your plan.',
      ],
    },
    {
      heading: 'How We Use Your Information',
      body: [
        'To operate and maintain your account.',
        'To verify your email address and authenticate your identity.',
        'To send you service-related emails (e.g., email verification, password reset).',
        'To improve our service through aggregated analytics, only with your explicit consent.',
        'To provide aggregate creator insights and recommendations, and to store your private creator workspace and review requested changes to public metadata.',
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
        'Optional browser analytics require consent through the cookie banner and adult eligibility. Web creator audience measurement additionally requires the Audience analytics account setting. The native iOS app uses the Audience privacy account setting and adult eligibility.',
        'You can turn audience analytics off in account settings. You can also turn browser analytics off in web settings. Withdrawal stops new optional audience collection and excludes your account from creator aggregates; previously retained records remain in your account export until cleanup or account deletion.',
        'See our Cookie Policy for full details.',
      ],
    },
    {
      heading: 'Data Retention',
      body: [
        'We retain your account information for as long as your account is active.',
        'Optional audience event records, impressions, reading-time and playback samples have a 90-day analysis window. Older samples are excluded from creator analysis immediately; bounded cleanup removes stored rows over time and can require operator action on an idle service or a backlog. Deletion is not guaranteed exactly at day 90.',
        'Consent history and private creator work remain associated with your account until deleted. Operational reading history and saved-content records serve separate account features and are not removed by the optional analytics cleanup. Your account export includes retained audience records and private creator work, including records waiting for cleanup.',
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
