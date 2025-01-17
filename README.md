# hexo-generator-baidu-sitemap

[![Build Status](https://travis-ci.org/hexojs/hexo-generator-sitemap.svg?branch=master)](https://travis-ci.org/hexojs/hexo-generator-sitemap)
[![NPM version](https://badge.fury.io/js/hexo-generator-sitemap.svg)](https://www.npmjs.com/package/hexo-generator-sitemap)
[![Coverage Status](https://img.shields.io/coveralls/hexojs/hexo-generator-sitemap.svg)](https://coveralls.io/r/hexojs/hexo-generator-sitemap?branch=master)

Generate baidu sitemap.

## Install

``` bash
$ npm install @xiandanin/hexo-generator-baidu-sitemap --save
```

- Hexo 4: 2.x
- Hexo 3: 1.x
- Hexo 2: 0.x

## Options

You can configure this plugin in `_config.yml`.

``` yaml
sitemap:
    path: baidusitemap.xml
    template: ./sitemap_template.xml
    rel: false
```

- **path** - Sitemap path. (Default: sitemap.xml)
- **template** - Custom template path. This file will be used to generate sitemap.xml (See [default template](/sitemap.xml))
- **rel** - Add [`rel-sitemap`](http://microformats.org/wiki/rel-sitemap) to the site's header. (Default: `false`)

## Excluding Posts

Add `baidusitemap: false` to the post's front matter.
