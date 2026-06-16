import { DRAFT_NOTICE, type LegalDoc } from './types'

const cookie: LegalDoc = {
  title: 'Cookie Policy',
  lastUpdated: '2026-06-16',
  draftNotice: DRAFT_NOTICE,
  sections: [
    {
      heading: 'What Are Cookies',
      body: [
        'Cookies are small text files stored on your device when you visit a website. We also use similar technologies such as localStorage for consent preferences.',
        'This Cookie Policy explains what cookies Jokes For uses, why, and how you can control them.',
      ],
    },
    {
      heading: 'Essential Storage',
      body: [
        'We use browser localStorage to store your session authentication token and your cookie consent choice.',
        'These are strictly necessary for the service to function — without them you cannot stay logged in or have your consent preference remembered.',
        'We do not require your consent to use these essential items.',
      ],
    },
    {
      heading: 'Optional Analytics Cookies (Consent Required)',
      body: [
        'We use Firebase Analytics (provided by Google) to collect aggregated, pseudonymous data about how users interact with Jokes For.',
        'This helps us understand which features are popular, where users encounter problems, and how to improve the service.',
        'Analytics cookies are only activated when you explicitly click "Accept" on our consent banner AND are 18 years of age or older.',
        'If you click "Reject", no analytics cookies are set and no analytics data is collected.',
      ],
    },
    {
      heading: 'Third-Party Services',
      body: [
        'Firebase Analytics is a service provided by Google LLC. When analytics are active, data is transmitted to Google\'s servers in accordance with Google\'s Privacy Policy.',
        'We do not use any other third-party analytics, advertising, or tracking cookies.',
      ],
    },
    {
      heading: 'How to Change Your Consent',
      body: [
        'You can change your cookie consent choice at any time by clearing your browser\'s localStorage for this site.',
        'After clearing, the consent banner will appear again on your next visit.',
        'You can also manage cookies via your browser settings. Note that blocking all cookies may prevent the service from working correctly.',
      ],
    },
    {
      heading: 'Contact Us',
      body: [
        'If you have questions about this Cookie Policy, please contact us at privacy@jokesfor.com.',
      ],
    },
  ],
}

export default cookie
