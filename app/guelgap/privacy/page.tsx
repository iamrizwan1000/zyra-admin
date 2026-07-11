'use client'

import {
  Page,
  Card,
  Text,
  BlockStack,
  Divider,
  Box,
} from '@shopify/polaris'

const sections = [
  {
    title: 'Data Collection',
    content:
      'FuelGap does not collect, store, or transmit any personal data. The app operates entirely offline on your device.',
  },
  {
    title: 'Data Storage',
    content:
      'The following data is stored locally on your device only (via AsyncStorage):',
    bullets: [
      'Food log: Records of foods you have logged, including quantities, calculated macronutrients, and timestamps.',
      'Daily targets: Your preferred calorie and macronutrient targets.',
    ],
    footer:
      'This data never leaves your device. It is only used to display your history and progress within the app.',
  },
  {
    title: 'Food Database',
    content:
      'FuelGap includes a pre-bundled food reference database sourced from publicly available USDA data. No network requests are made to access this data.',
  },
  {
    title: 'Notifications',
    content:
      'If you enable daily reminders, FuelGap schedules local notifications on your device. No notification data is sent to any server.',
  },
  {
    title: 'Third-Party Services',
    content:
      'FuelGap does not integrate any third-party analytics, crash reporting, advertising, or external services. No data is shared with any third party.',
  },
  {
    title: "Children's Privacy",
    content:
      'FuelGap does not knowingly collect any personal information from children.',
  },
  {
    title: 'Changes',
    content:
      'Any changes to this policy will be reflected here with an updated date.',
  },
  {
    title: 'Contact',
    content: 'waqarazhar@icloud.com',
  },
]

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#f6f6f7]">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <BlockStack gap="800">
          <Box paddingBlockEnd="400">
            <BlockStack gap="200">
              <Text variant="headingXl" as="h1">
                Privacy Policy
              </Text>
              <Text variant="bodyMd" as="p" tone="subdued">
                Last updated: June 28, 2026
              </Text>
            </BlockStack>
          </Box>

          {sections.map((section) => (
            <Card key={section.title}>
              <Box padding="500">
                <BlockStack gap="300">
                  <Text variant="headingLg" as="h2">
                    {section.title}
                  </Text>
                  <Text variant="bodyMd" as="p">
                    {section.content}
                  </Text>
                  {section.bullets && (
                    <Box paddingInlineStart="400">
                      <ul className="list-disc space-y-1">
                        {section.bullets.map((bullet) => (
                          <li key={bullet}>
                            <Text variant="bodyMd" as="span">
                              {bullet}
                            </Text>
                          </li>
                        ))}
                      </ul>
                    </Box>
                  )}
                  {section.footer && (
                    <Text variant="bodyMd" as="p" tone="subdued">
                      {section.footer}
                    </Text>
                  )}
                </BlockStack>
              </Box>
            </Card>
          ))}
        </BlockStack>
      </div>
    </div>
  )
}
