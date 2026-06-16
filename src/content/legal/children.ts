import { DRAFT_NOTICE, type LegalDoc } from './types'

const children: LegalDoc = {
  title: "Children's Privacy Policy",
  lastUpdated: '2026-06-16',
  draftNotice: DRAFT_NOTICE,
  sections: [
    {
      heading: 'Age Requirements',
      body: [
        'Jokes For is not directed to children under 13 years of age.',
        'We require all users to be at least 13 years old to register for an account.',
        'Age is verified at registration — users who indicate they are under 13 are blocked from creating an account.',
        'We do not provide a parental-consent flow for users under 13; access is simply not permitted.',
      ],
    },
    {
      heading: 'Information We Do Not Collect from Children',
      body: [
        'We do not knowingly collect or solicit personal information from children under 13.',
        'If we discover that we have inadvertently collected personal data from a child under 13, we will delete that information promptly.',
        'If you believe we have collected data from a child under 13, please contact us immediately at privacy@jokesfor.com.',
      ],
    },
    {
      heading: 'Users Between 13 and 17',
      body: [
        'Users between 13 and 17 years old may use the core features of Jokes For (reading and submitting jokes).',
        'Analytics are never activated for users under 18 — even if such a user clicks "Accept" on the consent banner, analytics will not be initialised.',
        'We do not display advertising or sponsored content to any users, including minors.',
      ],
    },
    {
      heading: 'COPPA Compliance',
      body: [
        'This service complies with the Children\'s Online Privacy Protection Act (COPPA).',
        'We do not collect personal information from children under 13 without verifiable parental consent, and we address this by blocking under-13 registration entirely.',
        'Parents or guardians who believe their child has provided us with personal information should contact privacy@jokesfor.com and we will delete the information.',
      ],
    },
    {
      heading: 'Parents and Guardians',
      body: [
        'If you are a parent or guardian and have concerns about your child\'s use of Jokes For, please contact us at privacy@jokesfor.com.',
        'We take children\'s privacy seriously and will respond to all parental inquiries promptly.',
      ],
    },
    {
      heading: 'Contact Us',
      body: [
        'For questions about this Children\'s Privacy Policy or our practices, contact us at privacy@jokesfor.com.',
      ],
    },
  ],
}

export default children
