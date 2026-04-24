const viewboxSize = 100
const centerX = 50
const centerY = 50

function createSketchyCircle() {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewboxSize} ${viewboxSize}" class="annotation-symbol">
      <defs>
        <filter id="roughCircle" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" result="noise"/>
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" xChannelSelector="R" yChannelSelector="G"/>
        </filter>
      </defs>
      
      <path d="M 50 12 
               Q 78 14, 86 40 
               Q 88 62, 70 86 
               Q 50 90, 30 84 
               Q 12 68, 14 42 
               Q 18 18, 50 12 Z" 
            fill="none" 
            stroke="currentColor" 
            stroke-width="5" 
            stroke-linecap="round" 
            stroke-linejoin="round"
            filter="url(#roughCircle)"/>
      
      <path d="M 48 14 
               Q 72 16, 82 38 
               Q 84 58, 68 82 
               Q 48 86, 32 82 
               Q 16 66, 18 44 
               Q 20 20, 48 14" 
            fill="none" 
            stroke="currentColor" 
            stroke-width="3" 
            stroke-linecap="round" 
            stroke-linejoin="round"
            opacity="0.6"
            stroke-dasharray="8,4"/>
      
      <path d="M 50 8 Q 75 10, 85 30" 
            stroke="currentColor" 
            stroke-width="4" 
            stroke-linecap="round" 
            opacity="0.4"/>
      <path d="M 88 55 L 82 70" 
            stroke="currentColor" 
            stroke-width="3" 
            stroke-linecap="round" 
            opacity="0.3"/>
      <path d="M 30 88 L 20 82" 
            stroke="currentColor" 
            stroke-width="3" 
            stroke-linecap="round" 
            opacity="0.3"/>
      <path d="M 10 45 L 16 35" 
            stroke="currentColor" 
            stroke-width="3" 
            stroke-linecap="round" 
            opacity="0.3"/>
    </svg>
  `
}

function createSketchyCheck() {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewboxSize} ${viewboxSize}" class="annotation-symbol">
      <defs>
        <filter id="roughCheck" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="3" result="noise"/>
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.5" xChannelSelector="R" yChannelSelector="G"/>
        </filter>
      </defs>
      
      <path d="M 18 48 
               L 28 52 
               Q 35 60, 42 68 
               Q 48 74, 55 70 
               L 62 62 
               Q 70 54, 78 46 
               Q 82 42, 84 38" 
            fill="none" 
            stroke="currentColor" 
            stroke-width="7" 
            stroke-linecap="round" 
            stroke-linejoin="round"
            filter="url(#roughCheck)"/>
      
      <path d="M 38 62 
               Q 42 68, 48 70" 
            stroke="currentColor" 
            stroke-width="9" 
            stroke-linecap="round" 
            opacity="0.7"/>
      
      <path d="M 22 50 L 32 58" 
            stroke="currentColor" 
            stroke-width="5" 
            stroke-linecap="round" 
            opacity="0.4"
            stroke-dasharray="6,3"/>
      <path d="M 58 65 L 68 55" 
            stroke="currentColor" 
            stroke-width="5" 
            stroke-linecap="round" 
            opacity="0.4"
            stroke-dasharray="6,3"/>
      
      <path d="M 15 55 L 20 60" 
            stroke="currentColor" 
            stroke-width="4" 
            stroke-linecap="round" 
            opacity="0.25"/>
      <path d="M 80 40 L 85 35" 
            stroke="currentColor" 
            stroke-width="4" 
            stroke-linecap="round" 
            opacity="0.25"/>
    </svg>
  `
}

function createSketchyCross() {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewboxSize} ${viewboxSize}" class="annotation-symbol">
      <defs>
        <filter id="roughCross" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="3" result="noise"/>
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.5" xChannelSelector="R" yChannelSelector="G"/>
        </filter>
      </defs>
      
      <path d="M 20 20 
               Q 28 28, 38 38 
               Q 45 45, 50 50 
               Q 58 58, 68 68 
               Q 75 75, 82 82" 
            fill="none" 
            stroke="currentColor" 
            stroke-width="7" 
            stroke-linecap="round" 
            stroke-linejoin="round"
            filter="url(#roughCross)"/>
      
      <path d="M 80 22 
               Q 72 30, 62 40 
               Q 55 47, 50 52 
               Q 42 60, 32 70 
               Q 25 78, 20 84" 
            fill="none" 
            stroke="currentColor" 
            stroke-width="7" 
            stroke-linecap="round" 
            stroke-linejoin="round"
            filter="url(#roughCross)"/>
      
      <path d="M 45 45 L 55 55" 
            stroke="currentColor" 
            stroke-width="10" 
            stroke-linecap="round" 
            opacity="0.6"/>
      <path d="M 55 45 L 45 55" 
            stroke="currentColor" 
            stroke-width="10" 
            stroke-linecap="round" 
            opacity="0.6"/>
      
      <path d="M 15 15 L 30 30" 
            stroke="currentColor" 
            stroke-width="5" 
            stroke-linecap="round" 
            opacity="0.35"
            stroke-dasharray="5,4"/>
      <path d="M 70 20 L 85 35" 
            stroke="currentColor" 
            stroke-width="5" 
            stroke-linecap="round" 
            opacity="0.35"
            stroke-dasharray="5,4"/>
      <path d="M 20 70 L 35 85" 
            stroke="currentColor" 
            stroke-width="5" 
            stroke-linecap="round" 
            opacity="0.35"
            stroke-dasharray="5,4"/>
      <path d="M 70 70 L 85 85" 
            stroke="currentColor" 
            stroke-width="5" 
            stroke-linecap="round" 
            opacity="0.35"
            stroke-dasharray="5,4"/>
    </svg>
  `
}

function createSketchyArrow() {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewboxSize} ${viewboxSize}" class="annotation-symbol">
      <defs>
        <filter id="roughArrow" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="3" result="noise"/>
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.5" xChannelSelector="R" yChannelSelector="G"/>
        </filter>
      </defs>
      
      <path d="M 12 50 
               Q 22 48, 35 50 
               Q 48 52, 60 50 
               Q 72 48, 82 50" 
            fill="none" 
            stroke="currentColor" 
            stroke-width="6" 
            stroke-linecap="round" 
            stroke-linejoin="round"
            filter="url(#roughArrow)"/>
      
      <path d="M 45 50 
               Q 55 50, 65 50" 
            stroke="currentColor" 
            stroke-width="8" 
            stroke-linecap="round" 
            opacity="0.5"/>
      
      <path d="M 65 35 
               Q 72 42, 82 50 
               Q 75 56, 68 62" 
            fill="none" 
            stroke="currentColor" 
            stroke-width="7" 
            stroke-linecap="round" 
            stroke-linejoin="round"/>
      
      <path d="M 72 38 L 82 50 L 72 60" 
            fill="none" 
            stroke="currentColor" 
            stroke-width="5" 
            stroke-linecap="round" 
            stroke-linejoin="round"
            opacity="0.4"
            stroke-dasharray="4,3"/>
      
      <path d="M 8 48 L 18 50" 
            stroke="currentColor" 
            stroke-width="5" 
            stroke-linecap="round" 
            opacity="0.3"/>
      <path d="M 85 50 L 90 50" 
            stroke="currentColor" 
            stroke-width="6" 
            stroke-linecap="round" 
            opacity="0.35"/>
    </svg>
  `
}

function createSketchyStar() {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewboxSize} ${viewboxSize}" class="annotation-symbol">
      <defs>
        <filter id="roughStar" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" result="noise"/>
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.5" xChannelSelector="R" yChannelSelector="G"/>
        </filter>
      </defs>
      
      <path d="M 50 10 
               L 58 35 
               Q 60 40, 65 40 
               L 88 42 
               Q 82 50, 72 58 
               Q 68 62, 70 72 
               L 75 92 
               Q 65 86, 55 82 
               Q 50 80, 45 82 
               Q 35 86, 25 92 
               L 30 72 
               Q 32 62, 28 58 
               Q 18 50, 12 42 
               L 35 40 
               Q 40 40, 42 35 
               Z" 
            fill="none" 
            stroke="currentColor" 
            stroke-width="5" 
            stroke-linecap="round" 
            stroke-linejoin="round"
            filter="url(#roughStar)"/>
      
      <path d="M 50 18 L 55 35" 
            stroke="currentColor" 
            stroke-width="7" 
            stroke-linecap="round" 
            opacity="0.6"/>
      <path d="M 65 42 L 82 44" 
            stroke="currentColor" 
            stroke-width="7" 
            stroke-linecap="round" 
            opacity="0.6"/>
      <path d="M 72 58 L 74 75" 
            stroke="currentColor" 
            stroke-width="7" 
            stroke-linecap="round" 
            opacity="0.6"/>
      <path d="M 45 80 L 35 86" 
            stroke="currentColor" 
            stroke-width="7" 
            stroke-linecap="round" 
            opacity="0.6"/>
      <path d="M 28 58 L 20 50" 
            stroke="currentColor" 
            stroke-width="7" 
            stroke-linecap="round" 
            opacity="0.6"/>
      
      <path d="M 50 12 L 75 40 L 65 45 L 72 55 L 58 52 L 52 45 Z" 
            fill="currentColor" 
            opacity="0.2"/>
    </svg>
  `
}

function createSketchyHeart() {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewboxSize} ${viewboxSize}" class="annotation-symbol">
      <defs>
        <filter id="roughHeart" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="3" result="noise"/>
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.5" xChannelSelector="R" yChannelSelector="G"/>
        </filter>
      </defs>
      
      <path d="M 50 88 
               Q 32 75, 22 60 
               Q 15 48, 18 38 
               Q 22 28, 32 24 
               Q 40 22, 48 28 
               Q 50 32, 50 42 
               Q 50 32, 52 28 
               Q 60 22, 68 24 
               Q 78 28, 82 38 
               Q 85 48, 78 60 
               Q 68 75, 50 88 
               Z" 
            fill="none" 
            stroke="currentColor" 
            stroke-width="5" 
            stroke-linecap="round" 
            stroke-linejoin="round"
            filter="url(#roughHeart)"/>
      
      <path d="M 50 80 
               Q 38 72, 30 62 
               Q 25 55, 26 48 
               Q 28 40, 35 36 
               Q 42 34, 47 38 
               Q 50 42, 50 48" 
            fill="none" 
            stroke="currentColor" 
            stroke-width="7" 
            stroke-linecap="round" 
            stroke-linejoin="round"
            opacity="0.5"/>
      
      <path d="M 30 32 L 40 36" 
            stroke="currentColor" 
            stroke-width="4" 
            stroke-linecap="round" 
            opacity="0.3"
            stroke-dasharray="3,3"/>
      <path d="M 55 32 L 65 36" 
            stroke="currentColor" 
            stroke-width="4" 
            stroke-linecap="round" 
            opacity="0.3"
            stroke-dasharray="3,3"/>
      
      <path d="M 50 82 Q 35 70, 28 60" 
            fill="currentColor" 
            opacity="0.15"/>
    </svg>
  `
}

function createSketchyFlag() {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewboxSize} ${viewboxSize}" class="annotation-symbol">
      <defs>
        <filter id="roughFlag" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="3" result="noise"/>
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.5" xChannelSelector="R" yChannelSelector="G"/>
        </filter>
      </defs>
      
      <path d="M 28 15 
               L 28 88" 
            fill="none" 
            stroke="currentColor" 
            stroke-width="6" 
            stroke-linecap="round" 
            stroke-linejoin="round"
            filter="url(#roughFlag)"/>
      
      <path d="M 28 15 
               Q 30 20, 28 25" 
            stroke="currentColor" 
            stroke-width="10" 
            stroke-linecap="round" 
            opacity="0.5"/>
      <path d="M 28 80 
               Q 30 84, 28 88" 
            stroke="currentColor" 
            stroke-width="10" 
            stroke-linecap="round" 
            opacity="0.5"/>
      
      <path d="M 28 18 
               Q 45 20, 55 24 
               Q 68 28, 80 32 
               Q 70 38, 55 42 
               Q 45 44, 28 48 
               Q 30 40, 28 35" 
            fill="none" 
            stroke="currentColor" 
            stroke-width="5" 
            stroke-linecap="round" 
            stroke-linejoin="round"
            filter="url(#roughFlag)"/>
      
      <path d="M 35 22 
               Q 50 25, 65 30 
               Q 55 35, 40 38" 
            fill="currentColor" 
            opacity="0.2"/>
      
      <path d="M 25 12 L 31 12" 
            stroke="currentColor" 
            stroke-width="4" 
            stroke-linecap="round" 
            opacity="0.35"/>
      <path d="M 25 90 L 31 90" 
            stroke="currentColor" 
            stroke-width="4" 
            stroke-linecap="round" 
            opacity="0.35"/>
    </svg>
  `
}

function createSketchyLightning() {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewboxSize} ${viewboxSize}" class="annotation-symbol">
      <defs>
        <filter id="roughLightning" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="3" result="noise"/>
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.5" xChannelSelector="R" yChannelSelector="G"/>
        </filter>
      </defs>
      
      <path d="M 70 10 
               Q 65 20, 55 28 
               Q 48 35, 42 42 
               Q 50 42, 58 42 
               Q 50 52, 42 62 
               Q 38 68, 30 82 
               Q 35 78, 40 74 
               Q 35 70, 38 65 
               Q 45 55, 52 48 
               Q 48 48, 44 48 
               Q 50 40, 58 32 
               Q 65 24, 72 15" 
            fill="none" 
            stroke="currentColor" 
            stroke-width="7" 
            stroke-linecap="round" 
            stroke-linejoin="round"
            filter="url(#roughLightning)"/>
      
      <path d="M 55 30 L 48 40" 
            stroke="currentColor" 
            stroke-width="10" 
            stroke-linecap="round" 
            opacity="0.5"/>
      <path d="M 48 55 L 42 65" 
            stroke="currentColor" 
            stroke-width="10" 
            stroke-linecap="round" 
            opacity="0.5"/>
      
      <path d="M 72 12 L 62 22" 
            stroke="currentColor" 
            stroke-width="5" 
            stroke-linecap="round" 
            opacity="0.35"
            stroke-dasharray="4,3"/>
      <path d="M 35 72 L 28 85" 
            stroke="currentColor" 
            stroke-width="5" 
            stroke-linecap="round" 
            opacity="0.35"
            stroke-dasharray="4,3"/>
      
      <path d="M 60 25 Q 52 35, 48 40 Q 55 42, 60 35 Q 55 45, 48 55" 
            fill="currentColor" 
            opacity="0.2"/>
    </svg>
  `
}

export const annotationSymbols = {
  circle: {
    name: '圈圈',
    svg: createSketchyCircle(),
    color: 'var(--calendar-theme-color)'
  },
  check: {
    name: '勾',
    svg: createSketchyCheck(),
    color: '#67c23a'
  },
  cross: {
    name: '叉',
    svg: createSketchyCross(),
    color: '#f56c6c'
  },
  arrow: {
    name: '箭头',
    svg: createSketchyArrow(),
    color: '#e6a23c'
  },
  star: {
    name: '星星',
    svg: createSketchyStar(),
    color: '#f0b90b'
  },
  heart: {
    name: '爱心',
    svg: createSketchyHeart(),
    color: '#ff6b6b'
  },
  flag: {
    name: '旗帜',
    svg: createSketchyFlag(),
    color: '#909399'
  },
  lightning: {
    name: '闪电',
    svg: createSketchyLightning(),
    color: '#409eff'
  }
}

export const symbolKeys = Object.keys(annotationSymbols)
