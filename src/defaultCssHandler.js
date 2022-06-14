let hasLess = false
try {
  __non_webpack_require__('less') && __non_webpack_require__('less-loader')
  hasLess = true
} catch (error) {
  console.warn('Less is not install, about to use css')
}

let hasSass = false
try {
  __non_webpack_require__('sass') && __non_webpack_require__('sass-loader')
  hasSass = true
} catch (error) {
  console.warn('Sass is not install, about to use css')
}

/**
 * 
 * @param {Set<String>} cssSet 
 */
 function antdv1CssHandler(cssSet) {
  const paths = []

  const components = new Set()

  components.add('')
  cssSet.forEach(component => {
    if (hasLess) {
      paths.push(`ant-design-vue/es/${component}/style`)
    } else {
      paths.push(`ant-design-vue/es/${component}/style/css.js`)
    }
  })

  return {
    lang: 'javascript',
    paths
  }
}

/**
 * 
 * @param {Set<String>} cssSet 
 */
function elementUICssHandler(cssSet) {
  const paths = []
  const components = new Set()
  components.add('base')
  cssSet.forEach(component => {
    components.add(component)
    if (component === 'button') {
      components.add('icon')
    } else if (component === 'link') {
      components.add('icon')
    } else if (component === 'input') {
      components.add('icon')
    } else if (component === 'autocomplete') {
      components.add('loading')
      components.add('icon')
    } else if (component === 'select') {
      components.add('icon')
    } else if (component === 'cascader') {
      components.add('icon')
      components.add('radio')
    } else if (component === 'time-picker') {
      components.add('icon')
    } else if (component === 'date-picker') {
      components.add('icon')
      components.add('button')
    } else if (component === 'upload') {
      components.add('icon')
    } else if (component === 'rate') {
      components.add('icon')
    } else if (component === 'color-picker') {
      components.add('button')
      components.add('input')
    } else if (component === 'transfer') {
      components.add('button')
      components.add('icon')
    } else if (component === 'table') {
      components.add('loading')
    } else if (component === 'nav-menu') {
      components.add('icon')
    }
  })

  components.forEach(component => {
    paths.push(`element-ui/lib/theme-chalk/${component}.${hasSass ? 'scss' : 'css'}`)
  })

  return {
    paths,
    lang: 'css'
  }
}
/**
 * 
 * @param {Set<String>} cssSet 
 */
function vantCssHandler(cssSet) {
  const components = new Set()
  const paths = []

  cssSet.forEach(component => {
    if (hasLess) {
      paths.push(`vant/es/${component}/style/less.js`)
    } else {
      paths.push(`ant/es/${component}/style`)
    }
  })

  return {
    lang: 'javascript',
    paths
  }
}

module.exports = {
  antdv1CssHandler,
  elementUICssHandler,
  vantCssHandler
}