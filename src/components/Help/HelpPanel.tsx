import React, { useState } from 'react'
import { HelpCircle, Book, Shield, FileText, MessageCircle, Mail, ExternalLink, ChevronRight, ChevronDown } from 'lucide-react'

export function HelpPanel() {
  const [activeSection, setActiveSection] = useState<string>('getting-started')
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null)

  const sections = [
    { id: 'getting-started', label: 'Getting Started', icon: Book },
    { id: 'user-manual', label: 'User Manual', icon: FileText },
    { id: 'privacy-policy', label: 'Privacy Policy', icon: Shield },
    { id: 'terms-conditions', label: 'Terms & Conditions', icon: FileText },
    { id: 'faq', label: 'FAQ', icon: HelpCircle },
    { id: 'contact', label: 'Contact Support', icon: MessageCircle },
  ]

  const faqs = [
    {
      id: 'account',
      question: 'How do I create an account?',
      answer: 'You can create an account by clicking the "Sign Up" button and filling out the registration form with your email, username, and password. You can also use the magic link option for passwordless authentication.'
    },
    {
      id: 'posts',
      question: 'What types of posts can I create?',
      answer: 'Vibe supports 6 types of posts: Quotes (💭), Poems (🎭), Thoughts (💡), Lyrics (🎵), Pickup Lines (😏), and Hinge Prompts (💘). Each type has its own emoji and styling.'
    },
    {
      id: 'privacy',
      question: 'Who can see my posts?',
      answer: 'By default, your posts are public and visible to everyone. You can adjust your privacy settings in the Settings panel to control who can see your profile and posts.'
    },
    {
      id: 'notifications',
      question: 'How do I manage notifications?',
      answer: 'Go to Settings > Notifications to customize which notifications you receive. You can toggle notifications for likes, comments, follows, and mentions.'
    },
    {
      id: 'delete',
      question: 'Can I delete my posts?',
      answer: 'Yes, you can delete your own posts by clicking the three dots menu on any of your posts and selecting "Delete Post". This action cannot be undone.'
    }
  ]

  const renderGettingStarted = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-4">Welcome to Vibe! 🎉</h3>
        <p className="text-gray-600 mb-6">
          Vibe is a social platform where you can share your thoughts, connect with others, and discover amazing content. 
          Here's everything you need to know to get started.
        </p>
      </div>

      <div className="grid gap-6">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
          <h4 className="font-semibold text-blue-900 mb-3 flex items-center">
            <span className="text-2xl mr-2">1️⃣</span>
            Create Your Profile
          </h4>
          <p className="text-blue-800 text-sm">
            Set up your profile with a display name, username, bio, and avatar. This helps others discover and connect with you.
          </p>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
          <h4 className="font-semibold text-green-900 mb-3 flex items-center">
            <span className="text-2xl mr-2">2️⃣</span>
            Share Your First Post
          </h4>
          <p className="text-green-800 text-sm">
            Click the "Create" button to share your thoughts. Choose from quotes, poems, thoughts, lyrics, pickup lines, or dating prompts.
          </p>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
          <h4 className="font-semibold text-purple-900 mb-3 flex items-center">
            <span className="text-2xl mr-2">3️⃣</span>
            Connect with Others
          </h4>
          <p className="text-purple-800 text-sm">
            Follow users you find interesting, like their posts, and engage through comments. Build your community!
          </p>
        </div>

        <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-6 border border-orange-200">
          <h4 className="font-semibold text-orange-900 mb-3 flex items-center">
            <span className="text-2xl mr-2">4️⃣</span>
            Explore Content
          </h4>
          <p className="text-orange-800 text-sm">
            Use the sidebar to explore different feeds: Home, Trending, Following, and Featured content.
          </p>
        </div>
      </div>
    </div>
  )

  const renderUserManual = () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-4">User Manual</h3>
        <p className="text-gray-600 mb-6">
          Complete guide to using all features of Vibe.
        </p>
      </div>

      <div className="space-y-6">
        <section>
          <h4 className="text-lg font-semibold text-gray-900 mb-3">📝 Creating Posts</h4>
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <p className="text-sm text-gray-700"><strong>Step 1:</strong> Click the "Create" button in the header</p>
            <p className="text-sm text-gray-700"><strong>Step 2:</strong> Choose your post type (Quote, Poem, Thought, etc.)</p>
            <p className="text-sm text-gray-700"><strong>Step 3:</strong> Write your content (max 500 characters)</p>
            <p className="text-sm text-gray-700"><strong>Step 4:</strong> Click "Publish" to share with the community</p>
          </div>
        </section>

        <section>
          <h4 className="text-lg font-semibold text-gray-900 mb-3">❤️ Interacting with Posts</h4>
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <p className="text-sm text-gray-700"><strong>Like:</strong> Click the heart icon to show appreciation</p>
            <p className="text-sm text-gray-700"><strong>Comment:</strong> Click the comment icon to start a conversation</p>
            <p className="text-sm text-gray-700"><strong>Share:</strong> Use the share button to copy links or share natively</p>
            <p className="text-sm text-gray-700"><strong>More Options:</strong> Click the three dots for additional actions</p>
          </div>
        </section>

        <section>
          <h4 className="text-lg font-semibold text-gray-900 mb-3">👥 Following & Followers</h4>
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <p className="text-sm text-gray-700"><strong>Follow Users:</strong> Click "Follow" on profiles or in the "Who to Follow" section</p>
            <p className="text-sm text-gray-700"><strong>View Followers:</strong> Check your profile to see who follows you</p>
            <p className="text-sm text-gray-700"><strong>Following Feed:</strong> Use the "Following" tab to see posts from people you follow</p>
          </div>
        </section>

        <section>
          <h4 className="text-lg font-semibold text-gray-900 mb-3">🔔 Notifications</h4>
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <p className="text-sm text-gray-700"><strong>Bell Icon:</strong> Click to view all notifications</p>
            <p className="text-sm text-gray-700"><strong>Types:</strong> Likes, comments, follows, and mentions</p>
            <p className="text-sm text-gray-700"><strong>Mark as Read:</strong> Click on notifications to mark them as read</p>
            <p className="text-sm text-gray-700"><strong>Settings:</strong> Customize notification preferences in Settings</p>
          </div>
        </section>

        <section>
          <h4 className="text-lg font-semibold text-gray-900 mb-3">🔍 Search & Discovery</h4>
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <p className="text-sm text-gray-700"><strong>Search Bar:</strong> Find users and posts using the search bar</p>
            <p className="text-sm text-gray-700"><strong>Trending:</strong> Discover popular content in the Trending section</p>
            <p className="text-sm text-gray-700"><strong>Featured:</strong> See posts from verified or popular users</p>
            <p className="text-sm text-gray-700"><strong>Right Panel:</strong> Check trending posts and suggested users</p>
          </div>
        </section>
      </div>
    </div>
  )

  const renderPrivacyPolicy = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-4">Privacy Policy</h3>
        <p className="text-sm text-gray-500 mb-6">Last updated: {new Date().toLocaleDateString()}</p>
      </div>

      <div className="space-y-6 text-sm text-gray-700">
        <section>
          <h4 className="text-lg font-semibold text-gray-900 mb-3">1. Information We Collect</h4>
          <div className="space-y-3">
            <p><strong>Account Information:</strong> Email address, username, display name, and profile picture.</p>
            <p><strong>Content:</strong> Posts, comments, likes, and other interactions you make on the platform.</p>
            <p><strong>Usage Data:</strong> How you interact with our service, including pages visited and features used.</p>
            <p><strong>Device Information:</strong> Browser type, operating system, and IP address for security purposes.</p>
          </div>
        </section>

        <section>
          <h4 className="text-lg font-semibold text-gray-900 mb-3">2. How We Use Your Information</h4>
          <div className="space-y-3">
            <p>• Provide and maintain our service</p>
            <p>• Personalize your experience and content recommendations</p>
            <p>• Send notifications about activity on your account</p>
            <p>• Improve our platform and develop new features</p>
            <p>• Ensure security and prevent abuse</p>
          </div>
        </section>

        <section>
          <h4 className="text-lg font-semibold text-gray-900 mb-3">3. Information Sharing</h4>
          <div className="space-y-3">
            <p><strong>Public Content:</strong> Posts and profile information are public by default.</p>
            <p><strong>Service Providers:</strong> We may share data with trusted service providers who help operate our platform.</p>
            <p><strong>Legal Requirements:</strong> We may disclose information when required by law or to protect our rights.</p>
            <p><strong>No Sale:</strong> We do not sell your personal information to third parties.</p>
          </div>
        </section>

        <section>
          <h4 className="text-lg font-semibold text-gray-900 mb-3">4. Your Privacy Controls</h4>
          <div className="space-y-3">
            <p>• Adjust your profile visibility settings</p>
            <p>• Control who can see your followers and following lists</p>
            <p>• Manage notification preferences</p>
            <p>• Delete your posts and comments</p>
            <p>• Request account deletion</p>
          </div>
        </section>

        <section>
          <h4 className="text-lg font-semibold text-gray-900 mb-3">5. Data Security</h4>
          <p>We implement appropriate security measures to protect your information against unauthorized access, alteration, disclosure, or destruction. However, no internet transmission is 100% secure.</p>
        </section>

        <section>
          <h4 className="text-lg font-semibold text-gray-900 mb-3">6. Contact Us</h4>
          <p>If you have questions about this Privacy Policy, please contact us at privacy@vibe.social</p>
        </section>
      </div>
    </div>
  )

  const renderTermsConditions = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-4">Terms & Conditions</h3>
        <p className="text-sm text-gray-500 mb-6">Last updated: {new Date().toLocaleDateString()}</p>
      </div>

      <div className="space-y-6 text-sm text-gray-700">
        <section>
          <h4 className="text-lg font-semibold text-gray-900 mb-3">1. Acceptance of Terms</h4>
          <p>By accessing and using Vibe, you accept and agree to be bound by the terms and provision of this agreement.</p>
        </section>

        <section>
          <h4 className="text-lg font-semibold text-gray-900 mb-3">2. User Accounts</h4>
          <div className="space-y-3">
            <p>• You must be at least 13 years old to use this service</p>
            <p>• You are responsible for maintaining the security of your account</p>
            <p>• You must provide accurate and complete information</p>
            <p>• One person may not maintain more than one account</p>
          </div>
        </section>

        <section>
          <h4 className="text-lg font-semibold text-gray-900 mb-3">3. Content Guidelines</h4>
          <div className="space-y-3">
            <p><strong>Prohibited Content:</strong></p>
            <p>• Harassment, bullying, or hate speech</p>
            <p>• Spam or misleading information</p>
            <p>• Adult content or violence</p>
            <p>• Copyright infringement</p>
            <p>• Illegal activities or content</p>
          </div>
        </section>

        <section>
          <h4 className="text-lg font-semibold text-gray-900 mb-3">4. User Conduct</h4>
          <div className="space-y-3">
            <p>• Be respectful to other users</p>
            <p>• Do not impersonate others</p>
            <p>• Do not attempt to hack or disrupt the service</p>
            <p>• Follow all applicable laws and regulations</p>
          </div>
        </section>

        <section>
          <h4 className="text-lg font-semibold text-gray-900 mb-3">5. Intellectual Property</h4>
          <p>You retain ownership of content you post, but grant us a license to use, display, and distribute it on our platform. You may not use our trademarks or copyrighted material without permission.</p>
        </section>

        <section>
          <h4 className="text-lg font-semibold text-gray-900 mb-3">6. Termination</h4>
          <p>We may terminate or suspend your account for violations of these terms. You may delete your account at any time through the settings page.</p>
        </section>

        <section>
          <h4 className="text-lg font-semibold text-gray-900 mb-3">7. Disclaimers</h4>
          <p>The service is provided "as is" without warranties. We are not liable for any damages arising from your use of the platform.</p>
        </section>

        <section>
          <h4 className="text-lg font-semibold text-gray-900 mb-3">8. Changes to Terms</h4>
          <p>We may update these terms from time to time. Continued use of the service constitutes acceptance of the new terms.</p>
        </section>
      </div>
    </div>
  )

  const renderFAQ = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h3>
        <p className="text-gray-600 mb-6">
          Find answers to common questions about using Vibe.
        </p>
      </div>

      <div className="space-y-4">
        {faqs.map((faq) => (
          <div key={faq.id} className="border border-gray-200 rounded-lg">
            <button
              onClick={() => setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
            >
              <span className="font-medium text-gray-900">{faq.question}</span>
              {expandedFAQ === faq.id ? (
                <ChevronDown className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronRight className="h-5 w-5 text-gray-500" />
              )}
            </button>
            {expandedFAQ === faq.id && (
              <div className="px-4 pb-4">
                <p className="text-gray-700 text-sm">{faq.answer}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )

  const renderContact = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-4">Contact Support</h3>
        <p className="text-gray-600 mb-6">
          Need help? We're here to assist you with any questions or issues.
        </p>
      </div>

      <div className="grid gap-6">
        <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center space-x-3 mb-4">
            <Mail className="h-6 w-6 text-blue-600" />
            <h4 className="font-semibold text-blue-900">Email Support</h4>
          </div>
          <p className="text-blue-800 text-sm mb-3">
            For general inquiries and support requests
          </p>
          <a 
            href="mailto:support@vibe.social" 
            className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium text-sm"
          >
            support@vibe.social
            <ExternalLink className="h-4 w-4 ml-1" />
          </a>
        </div>

        <div className="bg-green-50 rounded-xl p-6 border border-green-200">
          <div className="flex items-center space-x-3 mb-4">
            <Shield className="h-6 w-6 text-green-600" />
            <h4 className="font-semibold text-green-900">Report Abuse</h4>
          </div>
          <p className="text-green-800 text-sm mb-3">
            Report inappropriate content or behavior
          </p>
          <a 
            href="mailto:abuse@vibe.social" 
            className="inline-flex items-center text-green-600 hover:text-green-700 font-medium text-sm"
          >
            abuse@vibe.social
            <ExternalLink className="h-4 w-4 ml-1" />
          </a>
        </div>

        <div className="bg-purple-50 rounded-xl p-6 border border-purple-200">
          <div className="flex items-center space-x-3 mb-4">
            <FileText className="h-6 w-6 text-purple-600" />
            <h4 className="font-semibold text-purple-900">Business Inquiries</h4>
          </div>
          <p className="text-purple-800 text-sm mb-3">
            Partnerships, press, and business opportunities
          </p>
          <a 
            href="mailto:business@vibe.social" 
            className="inline-flex items-center text-purple-600 hover:text-purple-700 font-medium text-sm"
          >
            business@vibe.social
            <ExternalLink className="h-4 w-4 ml-1" />
          </a>
        </div>
      </div>

      <div className="bg-gray-50 rounded-xl p-6">
        <h4 className="font-semibold text-gray-900 mb-3">Response Times</h4>
        <div className="space-y-2 text-sm text-gray-700">
          <p>• General Support: 24-48 hours</p>
          <p>• Abuse Reports: 12-24 hours</p>
          <p>• Business Inquiries: 3-5 business days</p>
        </div>
      </div>
    </div>
  )

  const renderContent = () => {
    switch (activeSection) {
      case 'getting-started':
        return renderGettingStarted()
      case 'user-manual':
        return renderUserManual()
      case 'privacy-policy':
        return renderPrivacyPolicy()
      case 'terms-conditions':
        return renderTermsConditions()
      case 'faq':
        return renderFAQ()
      case 'contact':
        return renderContact()
      default:
        return renderGettingStarted()
    }
  }

  return (
    <div className="flex gap-6">
      {/* Sidebar */}
      <div className="w-64 bg-white rounded-2xl shadow-sm border border-gray-100 p-4 h-fit">
        <div className="space-y-2">
          {sections.map((section) => {
            const Icon = section.icon
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  activeSection === section.id
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="text-sm font-medium">{section.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        {renderContent()}
      </div>
    </div>
  )
}