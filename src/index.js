const { antdv1CssHandler, elementUICssHandler, vantCssHandler } = require('./defaultCssHandler')

module.exports = function (mates, compiler = 'vue-template-compiler') {
  const VueTemplateCompiler = __non_webpack_require__(compiler)

  const { JSDOM } = __non_webpack_require__('jsdom')
  const parseComponent = VueTemplateCompiler.parseComponent;
  const parse = VueTemplateCompiler.parse
  const dom = new JSDOM()

  global.window = dom.window
  global.document = window.document
  global.navigator = window.navigator

  let libs = {}

  for(const mate of mates) {
    libs[mate.library] = __non_webpack_require__(mate.library)
  }

  mates._libs = libs

  const handleVue = (ast, script, isVue3 = false, isSetup = false) => {
    const libs = mates._libs
    const nodesMap = new Map()
    const styles = []

    mates.forEach((mate) => {
      nodesMap.set(mate.library, new Set())
    })
  

    function findNode(node) {
      mates.forEach((mate) => {
        const { preIdentifier, library } = mate
        const regex = new RegExp(`^${preIdentifier}\\-`)

        if (regex.test(node.tag)) {
          nodesMap.get(library).add(node.tag.slice(preIdentifier.length + 1))
        }
        if (node.children) {
          for(const child of node.children) {
            findNode(child)
          }
        }
        for(const slot in node.scopedSlots) {
          findNode(node.scopedSlots[slot])
        }
      })
    }
  
    findNode(ast)

    let isHandle = false
    mates.forEach((mate) => {
      const { preIdentifier, library } = mate
      const nodes = nodesMap.get(library)

      if (nodes.size > 0) {
        let imports = ''
        const components = []
        const jsSet = new Set()
        const cssSet = new Set()

        if (preIdentifier === 'el') {
          if (nodes.has('skeleton')) {
            nodes.add('skeleton-item')
          }
        } else if (preIdentifier === 'a') {
          if (nodes.has('textarea')) {
            nodes.add('input')
          } else if (nodes.has('calendar')) {
            nodes.add('row')
            nodes.add('col')
            nodes.add('radio-group')
            nodes.add('radio')
            nodes.add('radio-button')
            nodes.add('select')
          } else if (nodes.has('table')) {
            nodes.add('pagination')
            nodes.add('dropdown')
          }
        }

        nodes.forEach((node) => {
          const strs = node.split('-')
          const upperStrs = strs.map((str) => {
            return str.slice(0, 1).toUpperCase() + str.slice(1)
          })
          for (let i = upperStrs.length; i > 0; -- i) {
            const key = upperStrs.slice(0, i).join('')
            if (!jsSet.has(key) && libs[library][key]) {
              imports += key + ` as _${preIdentifier}_${key},`
              components.push(`_${preIdentifier}_${key}`)
              jsSet.add(key)
              cssSet.add(strs.slice(0, i).join('-'))
            }
          }
        })

        if (imports) {
          imports = imports.slice(0, imports.length - 1)
        }
    
        if (imports) {
          const add = `import {${imports}} from '${library}';${components.length > 0}&&[${components}].forEach((c)=>_Vue.use(c));`
          if (script.indexOf(add) === -1) {
            script = add + script
            isHandle = true
          }
        }
        if (cssSet && isHandle) {
          let cssHandlerResult = null
          if (preIdentifier === 'el') {
            cssHandlerResult = elementUICssHandler(cssSet)
          } else if (preIdentifier === 'a') {
            cssHandlerResult = antdv1CssHandler(cssSet)
          } else if (preIdentifier === 'van') {
            cssHandlerResult = vantCssHandler(cssSet)
          }
          if (cssHandlerResult === null) {
            console.warn('Library is not support auto import style')
          } else {
            const { lang, paths } = cssHandlerResult
            if (lang === 'javascript') {
              script = paths.reduce((a, b) => a + `import '${b}';`, '') + script
            } else {
              styles.push({
                attrs: {
                  lang
                },
                content: paths.reduce((a, b) => `${a}@import '~${b}';`, '')
              })
            }
          }
        }
      }
    })

    if (isHandle) {
      if (isVue3) {
        if (isSetup) {
          script = `import {getCurrentInstance as _getCurrentInstance} from 'vue';const _Vue = _getCurrentInstance().appContext.config.globalProperties._Vue;` + script
        } else {
          throw Error('Auto import is not support the script that is not setup')
        }
      } else {
        script = `import _Vue from 'vue';` + script
      }
    }

    return {
      script,
      styles
    }
  }

  VueTemplateCompiler.parse = function(source, options) {
    const res = parse(source, options)

    const { template: {ast} } = res.descriptor
    let content = ''
    if (res.descriptor.scriptSetup) {
      content = res.descriptor.scriptSetup.content
    } else if (res.descriptor.script) {
      content = res.descriptor.script.content
    }

    const { script, styles } = handleVue(ast, content, true, !!res.descriptor.scriptSetup)

    if (res.descriptor.scriptSetup) {
      if (res.descriptor.scriptSetup.content !== script) {
        res.descriptor.source = res.descriptor.source.replace(/(<script\s*[^>]*>)[\w\W\S\s\r\n]*(<\/script>)/, `$1${script}$2`)
        res.descriptor.scriptSetup.content = script
        res.descriptor.scriptSetup.loc.source = script
        res.descriptor.scriptSetup.loc.end.offset =  res.descriptor.scriptSetup.loc.start.offset + script.length
      }
    } else if (res.descriptor.script) {
      if (res.descriptor.script.content !== script) {
        res.descriptor.script.content = script
        res.descriptor.script.loc.source = script
        res.descriptor.script.loc.end.offset =  res.descriptor.script.loc.start.offset + script.length
      }
    }
    res.descriptor.styles.push(...styles)
  
    return res
  }

  VueTemplateCompiler.parseComponent = function (template, options) {
    const res = parseComponent(template, options)
    const ast = VueTemplateCompiler.compile(res.template.content).ast

    handleVue(ast, res.script.content || '')
    const { script, styles } = handleVue(ast, res.script.content)

    res.script.content = script
    res.styles.push(...styles)

    return res
  }
  return VueTemplateCompiler
}