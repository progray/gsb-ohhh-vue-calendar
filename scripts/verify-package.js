import { existsSync, readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = resolve(__dirname, '..')
const distDir = resolve(rootDir, 'dist')

console.log('========================================')
console.log('  ohhh-vue-calendar 包验证脚本')
console.log('========================================\n')

let allPassed = true

function check(condition, message) {
  if (condition) {
    console.log(`✅ ${message}`)
  } else {
    console.log(`❌ ${message}`)
    allPassed = false
  }
}

function checkFileExists(filePath, description) {
  const exists = existsSync(filePath)
  check(exists, `${description}: ${filePath}`)
  return exists
}

console.log('📁 检查 dist 目录结构...\n')

checkFileExists(distDir, 'dist 目录存在')

const esmFile = resolve(distDir, 'ohhh-vue-calendar.es.js')
const cjsFile = resolve(distDir, 'ohhh-vue-calendar.cjs.js')
const styleCss = resolve(distDir, 'styles/style.css')
const styleMobileCss = resolve(distDir, 'styles/style-mobile.css')
const typesDir = resolve(distDir, 'types')
const typesIndex = resolve(typesDir, 'index.d.ts')

console.log('\n📦 检查打包产物...\n')

checkFileExists(esmFile, 'ESM 格式产物')
checkFileExists(cjsFile, 'CommonJS 格式产物')
checkFileExists(styleCss, '默认样式文件')
checkFileExists(styleMobileCss, '移动端样式文件')
checkFileExists(typesDir, '类型声明目录')
checkFileExists(typesIndex, '类型声明入口文件')

console.log('\n🔍 验证文件内容...\n')

if (existsSync(esmFile)) {
  const esmContent = readFileSync(esmFile, 'utf-8')
  check(
    esmContent.includes('OhhhVueCalendar') || esmContent.includes('ohhh-vue-calendar'),
    'ESM 文件包含组件导出'
  )
  check(
    esmContent.includes('export') && !esmContent.includes('module.exports'),
    'ESM 文件使用正确的模块语法'
  )
}

if (existsSync(cjsFile)) {
  const cjsContent = readFileSync(cjsFile, 'utf-8')
  check(
    cjsContent.includes('module.exports') || cjsContent.includes('exports.'),
    'CommonJS 文件使用正确的模块语法'
  )
}

if (existsSync(styleCss)) {
  const styleContent = readFileSync(styleCss, 'utf-8')
  check(
    styleContent.includes('.ohhh-calendar-container'),
    '样式文件包含日历组件样式'
  )
  check(
    styleContent.includes('--calendar-theme-color'),
    '样式文件包含主题变量'
  )
}

if (existsSync(styleMobileCss)) {
  const mobileContent = readFileSync(styleMobileCss, 'utf-8')
  check(
    mobileContent.includes('--calendar-row-height'),
    '移动端样式文件包含响应式变量'
  )
}

if (existsSync(typesIndex)) {
  const typesContent = readFileSync(typesIndex, 'utf-8')
  check(
    typesContent.includes('OhhhVueCalendar'),
    '类型声明包含组件类型'
  )
  check(
    typesContent.includes('install') || typesContent.includes('App'),
    '类型声明包含 Vue Plugin 相关类型'
  )
}

console.log('\n📋 验证 package.json 配置...\n')

const pkgPath = resolve(rootDir, 'package.json')
if (existsSync(pkgPath)) {
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
  
  check(pkg.main === './dist/ohhh-vue-calendar.cjs.js', 'main 字段指向 CommonJS 入口')
  check(pkg.module === './dist/ohhh-vue-calendar.es.js', 'module 字段指向 ESM 入口')
  check(pkg.types === './dist/types/index.d.ts', 'types 字段指向类型声明')
  
  check(pkg.exports && pkg.exports['.'], 'exports 字段配置正确')
  check(pkg.exports['.'].import === './dist/ohhh-vue-calendar.es.js', 'exports.import 配置正确')
  check(pkg.exports['.'].require === './dist/ohhh-vue-calendar.cjs.js', 'exports.require 配置正确')
  
  check(pkg.exports['./style'], 'exports 包含样式入口')
  check(pkg.exports['./style/mobile'], 'exports 包含移动端样式入口')
  
  check(pkg.files && pkg.files.includes('dist'), 'files 字段包含 dist 目录')
}

console.log('\n========================================')
if (allPassed) {
  console.log('🎉 所有验证通过！')
  console.log('\n📦 包结构说明：')
  console.log('   - ESM: dist/ohhh-vue-calendar.es.js')
  console.log('   - CommonJS: dist/ohhh-vue-calendar.cjs.js')
  console.log('   - 类型声明: dist/types/')
  console.log('   - 默认样式: dist/styles/style.css')
  console.log('   - 移动端样式: dist/styles/style-mobile.css')
  console.log('\n📖 使用方式：')
  console.log('   // ESM 方式')
  console.log('   import OhhhVueCalendar from "ohhh-vue-calendar"')
  console.log('   import "ohhh-vue-calendar/style"')
  console.log('   // 或移动端样式')
  console.log('   import "ohhh-vue-calendar/style/mobile"')
  console.log('')
  console.log('   // CommonJS 方式')
  console.log('   const OhhhVueCalendar = require("ohhh-vue-calendar")')
  console.log('   require("ohhh-vue-calendar/style")')
  console.log('')
  console.log('   // Vue Plugin 方式')
  console.log('   import { createApp } from "vue"')
  console.log('   import OhhhVueCalendar from "ohhh-vue-calendar"')
  console.log('   import "ohhh-vue-calendar/style"')
  console.log('   const app = createApp(App)')
  console.log('   app.use(OhhhVueCalendar)')
} else {
  console.log('❌ 部分验证失败，请检查上述错误')
  process.exit(1)
}
console.log('========================================\n')
