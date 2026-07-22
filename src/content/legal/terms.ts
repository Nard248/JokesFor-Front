import { DRAFT_NOTICE, type LegalDoc } from './types'

const terms: LegalDoc = {
  title: 'Terms of Service',
  lastUpdated: '2026-07-23',
  draftNotice: DRAFT_NOTICE,
  sections: [
    {
      heading: 'Acceptance of Terms',
      body: [
        'By creating an account or using Jokes For, you agree to these Terms of Service ("Terms").',
        'If you do not agree, please do not use the service.',
        'We may update these Terms from time to time. Continued use of the service after changes constitutes acceptance.',
      ],
    },
    {
      heading: 'Eligibility',
      body: [
        'You must be at least 13 years old to use Jokes For.',
        'By registering, you represent that you meet this age requirement.',
        'Users under 18 may use the service but analytics features require adult (18+) consent.',
      ],
    },
    {
      heading: 'Your Account',
      body: [
        'You are responsible for maintaining the security of your account and password.',
        'You must provide accurate and complete information when registering.',
        'You must verify your email address to access all features.',
        'You may not share your account with others or use another person\'s account without permission.',
      ],
    },
    {
      heading: 'Acceptable Use',
      body: [
        'You may submit text jokes and, where the feature is available, image-based jokes you own or have the right to publish. All uploads are screened automatically and reviewed by our moderation team before publication, and metadata (such as EXIF location data) is removed from images at upload. Do not upload content that is unlawful, infringing, sexually explicit, violent, or that depicts identifiable private individuals without their consent. We may remove any upload at our discretion and suspend accounts that repeatedly violate these rules. Short video and audio clips are also supported where the feature is available; they are screened and reviewed before publication just like images.',
        'In addition, you may not:',
        '- Post content that is illegal, hateful, threatening, harassing, or discriminatory.',
        '- Submit jokes that contain personal attacks, doxxing, or content targeting individuals.',
        '- Use the platform for spam, phishing, or commercial solicitation.',
        '- Attempt to circumvent access controls, scrape the platform, or interfere with its operation.',
      ],
    },
    {
      heading: 'Content You Submit',
      body: [
        'You retain ownership of jokes and other text content you submit.',
        'By submitting content, you grant Jokes For a non-exclusive, worldwide, royalty-free license to display and distribute your content on the platform.',
        'You represent that you have the right to submit the content and that it does not violate any third-party rights.',
        'We reserve the right to remove content that violates these Terms or our community guidelines.',
      ],
    },
    {
      heading: 'Termination',
      body: [
        'We may suspend or terminate your account if you violate these Terms.',
        'You may delete your account at any time via the Settings page.',
        'Upon termination, your right to use the service ceases immediately.',
      ],
    },
    {
      heading: 'Disclaimer of Warranties',
      body: [
        'Jokes For is provided "as is" without warranties of any kind, express or implied.',
        'We do not warrant that the service will be uninterrupted, error-free, or secure.',
      ],
    },
    {
      heading: 'Limitation of Liability',
      body: [
        'To the fullest extent permitted by law, Jokes For shall not be liable for any indirect, incidental, or consequential damages arising from your use of the service.',
      ],
    },
    {
      heading: 'Contact Us',
      body: [
        'For questions about these Terms, please contact us at legal@jokesfor.com.',
      ],
    },
  ],
}

export default terms
