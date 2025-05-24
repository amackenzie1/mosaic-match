import { useState } from 'react'

const LetterDisplay = ({
  letter,
  significance,
}: {
  letter: string
  significance: number
}) => {
  const [isHovered, setIsHovered] = useState(false)

  const getLetterColor = (significance: number) => {
    // 50-55: red
    // 55-65: orange
    // 65-75: green
    // 75-: blue
    if (significance < 0.5) {
      return 'red'
    } else if (significance < 0.65) {
      return 'orange'
    } else if (significance < 0.75) {
      return 'green'
    } else {
      return 'blue'
    }
  }

  return (
    <div
      style={{
        color: getLetterColor(significance),
        position: 'relative',
        display: 'inline-block',
      }}
      onMouseEnter={() => {
        console.log('Hovered!')
        setIsHovered(true)
      }}
      onMouseLeave={() => setIsHovered(false)}
    >
      {letter}
      {isHovered && (
        <div
          style={{
            position: 'absolute',
            top: '0%',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '5px 10px',
            borderRadius: '4px',
            fontSize: '14px',
            whiteSpace: 'nowrap',
            zIndex: 10,
          }}
        >
          Certainty: {Math.round(significance * 100)}%
        </div>
      )}
    </div>
  )
}

export default LetterDisplay
