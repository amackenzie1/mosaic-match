export const validMBTITypes = [
  'ISTJ-a',
  'ISTJ-t',
  'ISFJ-a',
  'ISFJ-t',
  'INFJ-a',
  'INFJ-t',
  'INTJ-a',
  'INTJ-t',
  'ISTP-a',
  'ISTP-t',
  'ISFP-a',
  'ISFP-t',
  'INFP-a',
  'INFP-t',
  'INTP-a',
  'INTP-t',
  'ESTP-a',
  'ESTP-t',
  'ESFP-a',
  'ESFP-t',
  'ENFP-a',
  'ENFP-t',
  'ENTP-a',
  'ENTP-t',
  'ESTJ-a',
  'ESTJ-t',
  'ESFJ-a',
  'ESFJ-t',
  'ENFJ-a',
  'ENFJ-t',
  'ENTJ-a',
  'ENTJ-t',
]

export type MBTILetter = (typeof validMBTITypes)[number]

export const traits: Record<
  MBTILetter,
  { strengths: string[]; weaknesses: string[] }
> = {
  'ISTJ-a': {
    strengths: [
      'Responsible',
      'Organized',
      'Dependable',
      'Practical',
      'Detail-oriented',
    ],
    weaknesses: [
      'Stubborn',
      'Insensitive',
      'Rigid',
      'Judgmental',
      'Unyielding',
    ],
  },
  'ISTJ-t': {
    strengths: [
      'Responsible',
      'Organized',
      'Dependable',
      'Practical',
      'Conscientious',
    ],
    weaknesses: [
      'Stubborn',
      'Insensitive',
      'Overly Critical',
      'Judgmental',
      'Self-doubting',
    ],
  },
  'ISFJ-a': {
    strengths: ['Supportive', 'Reliable', 'Patient', 'Loyal', 'Practical'],
    weaknesses: [
      'Overprotective',
      'Reluctant to Change',
      'Self-Sacrificing',
      'Sensitive to Criticism',
      'Resistant to Innovation',
    ],
  },
  'ISFJ-t': {
    strengths: ['Supportive', 'Reliable', 'Patient', 'Loyal', 'Cautious'],
    weaknesses: [
      'Overprotective',
      'Reluctant to Change',
      'Self-Sacrificing',
      'Anxious',
      'Overly Self-Critical',
    ],
  },
  'INFJ-a': {
    strengths: [
      'Insightful',
      'Creative',
      'Inspiring',
      'Decisive',
      'Determined',
    ],
    weaknesses: [
      'Sensitive',
      'Perfectionistic',
      'Private',
      'Stubborn',
      'Prone to Burnout',
    ],
  },
  'INFJ-t': {
    strengths: [
      'Insightful',
      'Creative',
      'Inspiring',
      'Decisive',
      'Idealistic',
    ],
    weaknesses: [
      'Sensitive',
      'Perfectionistic',
      'Private',
      'Stubborn',
      'Self-Critical',
    ],
  },
  'INTJ-a': {
    strengths: [
      'Strategic',
      'Independent',
      'Decisive',
      'Innovative',
      'Confident',
    ],
    weaknesses: [
      'Arrogant',
      'Overly Critical',
      'Perfectionistic',
      'Emotionally Distant',
      'Impatient',
    ],
  },
  'INTJ-t': {
    strengths: [
      'Strategic',
      'Independent',
      'Decisive',
      'Innovative',
      'Self-Aware',
    ],
    weaknesses: [
      'Arrogant',
      'Overly Critical',
      'Perfectionistic',
      'Emotionally Distant',
      'Self-Doubting',
    ],
  },
  'ISTP-a': {
    strengths: [
      'Practical',
      'Adaptable',
      'Resourceful',
      'Calm Under Pressure',
      'Independent',
    ],
    weaknesses: ['Insensitive', 'Impulsive', 'Aloof', 'Risk-Prone', 'Detached'],
  },
  'ISTP-t': {
    strengths: [
      'Practical',
      'Adaptable',
      'Resourceful',
      'Calm Under Pressure',
      'Cautious',
    ],
    weaknesses: [
      'Insensitive',
      'Impulsive',
      'Aloof',
      'Risk-Averse',
      'Self-Critical',
    ],
  },
  'ISFP-a': {
    strengths: ['Artistic', 'Sensitive', 'Charming', 'Imaginative', 'Flexible'],
    weaknesses: [
      'Indecisive',
      'Unpredictable',
      'Easily Stressed',
      'Overly Private',
      'Avoids Confrontation',
    ],
  },
  'ISFP-t': {
    strengths: [
      'Artistic',
      'Sensitive',
      'Charming',
      'Imaginative',
      'Thoughtful',
    ],
    weaknesses: [
      'Indecisive',
      'Unpredictable',
      'Easily Stressed',
      'Overly Private',
      'Self-Critical',
    ],
  },
  'INFP-a': {
    strengths: [
      'Empathetic',
      'Open-Minded',
      'Idealistic',
      'Creative',
      'Passionate',
    ],
    weaknesses: [
      'Overly Idealistic',
      'Self-Critical',
      'Reserved',
      'Easily Distracted',
      'Emotionally Vulnerable',
    ],
  },
  'INFP-t': {
    strengths: [
      'Empathetic',
      'Open-Minded',
      'Idealistic',
      'Creative',
      'Reflective',
    ],
    weaknesses: [
      'Overly Idealistic',
      'Self-Critical',
      'Reserved',
      'Easily Distracted',
      'Overly Self-Conscious',
    ],
  },
  'INTP-a': {
    strengths: [
      'Analytical',
      'Original',
      'Open-Minded',
      'Curious',
      'Innovative',
    ],
    weaknesses: [
      'Insensitive',
      'Absent-Minded',
      'Procrastinating',
      'Reserved',
      'Dismissive of Emotions',
    ],
  },
  'INTP-t': {
    strengths: [
      'Analytical',
      'Original',
      'Open-Minded',
      'Curious',
      'Reflective',
    ],
    weaknesses: [
      'Insensitive',
      'Absent-Minded',
      'Procrastinating',
      'Reserved',
      'Overly Self-Critical',
    ],
  },
  'ESTP-a': {
    strengths: ['Bold', 'Rational', 'Practical', 'Perceptive', 'Direct'],
    weaknesses: [
      'Insensitive',
      'Impatient',
      'Risk-Prone',
      'Unstructured',
      'Defiant',
    ],
  },
  'ESTP-t': {
    strengths: ['Bold', 'Rational', 'Practical', 'Perceptive', 'Self-Aware'],
    weaknesses: [
      'Insensitive',
      'Impatient',
      'Risk-Averse',
      'Unstructured',
      'Self-Critical',
    ],
  },
  'ESFP-a': {
    strengths: [
      'Energetic',
      'Enthusiastic',
      'Entertaining',
      'Practical',
      'Observant',
    ],
    weaknesses: [
      'Sensitive',
      'Easily Bored',
      'Unfocused',
      'Defiant',
      'Restless',
    ],
  },
  'ESFP-t': {
    strengths: [
      'Energetic',
      'Enthusiastic',
      'Entertaining',
      'Practical',
      'Grounded',
    ],
    weaknesses: [
      'Sensitive',
      'Easily Bored',
      'Unfocused',
      'Defiant',
      'Self-Critical',
    ],
  },
  'ENFP-a': {
    strengths: [
      'Enthusiastic',
      'Creative',
      'Sociable',
      'Optimistic',
      'Empathetic',
    ],
    weaknesses: [
      'Overly Idealistic',
      'Disorganized',
      'Easily Stressed',
      'Overly Emotional',
      'Restless',
    ],
  },
  'ENFP-t': {
    strengths: [
      'Enthusiastic',
      'Creative',
      'Sociable',
      'Optimistic',
      'Reflective',
    ],
    weaknesses: [
      'Overly Idealistic',
      'Disorganized',
      'Easily Stressed',
      'Overly Emotional',
      'Self-Doubting',
    ],
  },
  'ENTP-a': {
    strengths: [
      'Innovative',
      'Adaptable',
      'Charismatic',
      'Quick-Witted',
      'Confident',
    ],
    weaknesses: [
      'Argumentative',
      'Insensitive',
      'Unfocused',
      'Impatient',
      'Overconfident',
    ],
  },
  'ENTP-t': {
    strengths: [
      'Innovative',
      'Adaptable',
      'Charismatic',
      'Quick-Witted',
      'Self-Aware',
    ],
    weaknesses: [
      'Argumentative',
      'Insensitive',
      'Unfocused',
      'Impatient',
      'Self-Doubting',
    ],
  },
  'ESTJ-a': {
    strengths: ['Efficient', 'Dedicated', 'Organized', 'Direct', 'Practical'],
    weaknesses: [
      'Stubborn',
      'Insensitive',
      'Inflexible',
      'Judgmental',
      'Dominant',
    ],
  },
  'ESTJ-t': {
    strengths: ['Efficient', 'Dedicated', 'Organized', 'Direct', 'Self-Aware'],
    weaknesses: [
      'Stubborn',
      'Insensitive',
      'Inflexible',
      'Judgmental',
      'Self-Critical',
    ],
  },
  'ESFJ-a': {
    strengths: ['Supportive', 'Reliable', 'Sociable', 'Loyal', 'Practical'],
    weaknesses: [
      'Needy',
      'Approval-Seeking',
      'Overly Emotional',
      'Inflexible',
      'Judgmental',
    ],
  },
  'ESFJ-t': {
    strengths: ['Supportive', 'Reliable', 'Sociable', 'Loyal', 'Cautious'],
    weaknesses: [
      'Needy',
      'Approval-Seeking',
      'Overly Emotional',
      'Inflexible',
      'Self-Critical',
    ],
  },
  'ENFJ-a': {
    strengths: [
      'Charismatic',
      'Altruistic',
      'Reliable',
      'Inspiring',
      'Decisive',
    ],
    weaknesses: [
      'Overly Idealistic',
      'Unrealistic',
      'Too Selfless',
      'Overly Sensitive',
      'Fluctuating Self-Esteem',
    ],
  },
  'ENFJ-t': {
    strengths: [
      'Charismatic',
      'Altruistic',
      'Reliable',
      'Inspiring',
      'Self-Aware',
    ],
    weaknesses: [
      'Overly Idealistic',
      'Unrealistic',
      'Too Selfless',
      'Overly Sensitive',
      'Self-Critical',
    ],
  },
  'ENTJ-a': {
    strengths: ['Confident', 'Decisive', 'Efficient', 'Strategic', 'Assertive'],
    weaknesses: [
      'Impatient',
      'Arrogant',
      'Insensitive',
      'Intolerant',
      'Domineering',
    ],
  },
  'ENTJ-t': {
    strengths: [
      'Confident',
      'Decisive',
      'Efficient',
      'Strategic',
      'Self-Improving',
    ],
    weaknesses: [
      'Impatient',
      'Arrogant',
      'Insensitive',
      'Intolerant',
      'Perfectionistic',
    ],
  },
}

// Helper function to get traits for a given MBTI type
export const getTraits = (
  mbtiType: string
): { strengths: string[]; weaknesses: string[] } => {
  const baseType = mbtiType.slice(0, 4)
  const variant = mbtiType.slice(-1).toLowerCase()
  const fullType = `${baseType}-${variant}` as MBTILetter

  if (traits[fullType]) {
    return traits[fullType]
  } else {
    // Fallback to base type without variant if not found
    const fallbackType = `${baseType}-a` as MBTILetter
    return traits[fallbackType] || { strengths: [], weaknesses: [] }
  }
}
