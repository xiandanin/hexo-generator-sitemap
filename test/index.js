'use strict';

require('chai').should();
const Hexo = require('hexo');
const cheerio = require('cheerio');
const { encodeURL } = require('hexo-util');

describe('Sitemap generator', () => {
  const hexo = new Hexo(__dirname, {silent: true});
  hexo.config.baidusitemap = {
    path: 'sitemap.xml'
  };
  const Post = hexo.model('Post');
  const Page = hexo.model('Page');
  const generator = require('../lib/generator').bind(hexo);
  const sitemapTmpl = require('../lib/template')(hexo.config);
  let posts = [];
  let locals = {};

  before(() => {
    return hexo.init().then(() => {
      return Post.insert([
        {source: 'foo', slug: 'foo', updated: 1e8},
        {source: 'bar', slug: 'bar', updated: 1e8 + 1},
        {source: 'baz', slug: 'baz', updated: 1e8 - 1}
      ]).then(data => {
        posts = data;
      }).then(() => {
        return Page.insert([
          {source: 'bio/index.md', path: 'bio/', updated: 1e8 - 3},
          {source: 'about/index.md', path: 'about/', updated: 1e8 - 4}
        ]);
      }).then(data => {
        posts = posts.concat(data);
        posts = posts.sort((a, b) => b.updated - a.updated);
        locals = hexo.locals.toObject();
      });
    });
  });

  it('default', () => {
    const result = generator(locals);

    result.path.should.eql('sitemap.xml');
    result.data.should.eql(sitemapTmpl.render({
      config: hexo.config,
      posts: posts
    }));

    const $ = cheerio.load(result.data);

    $('url').each((index, element) => {
      $(element).children('loc').text().should.eql(posts[index].permalink);
      $(element).children('lastmod').text().should.eql(posts[index].updated.toISOString());
    });
  });

  describe('skip_render', () => {
    it('array', () => {
      hexo.config.skip_render = ['foo'];

      const result = generator(locals);
      result.data.should.not.contain('foo');
    });

    it('string', () => {
      hexo.config.skip_render = 'bar';

      const result = generator(locals);
      result.data.should.not.contain('bar');
    });

    it('invalid type', () => {
      hexo.config.skip_render = { foo: 'bar' };

      const result = generator(locals);
      result.should.be.ok;
    });

    it('off', () => {
      hexo.config.skip_render = null;

      const result = generator(locals);
      result.should.be.ok;
    });
  });
});

it('No posts', () => {
  const hexo = new Hexo(__dirname, { silent: true });
  hexo.config.baidusitemap = {
    path: 'sitemap.xml'
  };
  const Post = hexo.model('Post');
  const generator = require('../lib/generator').bind(hexo);

  return Post.insert([]).then(data => {
    const locals = hexo.locals.toObject();
    const result = typeof generator(locals);

    result.should.eql('undefined');
  });
});

describe('Rel-Sitemap', () => {
  const hexo = new Hexo();
  hexo.config.baidusitemap = {
    path: 'sitemap.xml',
    rel: true
  };
  const relSitemap = require('../lib/rel').bind(hexo);

  it('default', () => {
    const content = '<head><link></head>';
    const result = relSitemap(content);

    const $ = cheerio.load(result);
    $('link[rel="sitemap"]').length.should.eql(1);
    $('link[rel="sitemap"]').attr('href').should.eql(hexo.config.root + hexo.config.baidusitemap.path);

    result.should.eql('<head><link><link rel="sitemap" type="application/xml" title="Sitemap" href="/sitemap.xml"></head>');
  });

  it('prepend root', () => {
    hexo.config.root = '/root/';
    const content = '<head><link></head>';
    const result = relSitemap(content);

    const $ = cheerio.load(result);
    $('link[rel="sitemap"]').attr('href').should.eql(hexo.config.root + hexo.config.baidusitemap.path);

    result.should.eql('<head><link><link rel="sitemap" type="application/xml" title="Sitemap" href="/root/sitemap.xml"></head>');
    hexo.config.root = '/';
  });

  it('disable', () => {
    hexo.config.baidusitemap.rel = false;
    const content = '<head><link></head>';
    const result = relSitemap(content);

    const resultType = typeof result;
    resultType.should.eql('undefined');
    hexo.config.baidusitemap.rel = true;
  });

  it('no duplicate tag', () => {
    const content = '<head><link>'
      + '<link rel="sitemap" type="application/xml" title="Sitemap" href="/sitemap.xml"></head>';
    const result = relSitemap(content);

    const resultType = typeof result;
    resultType.should.eql('undefined');
  });

  it('ignore empty head tag', () => {
    const content = '<head></head>'
      + '<head><link></head>'
      + '<head></head>';
    const result = relSitemap(content);

    const $ = cheerio.load(result);
    $('link[rel="sitemap"]').length.should.eql(1);

    const expected = '<head></head>'
    + '<head><link><link rel="sitemap" type="application/xml" title="Sitemap" href="/sitemap.xml"></head>'
    + '<head></head>';
    result.should.eql(expected);
  });

  it('apply to first non-empty head tag only', () => {
    const content = '<head></head>'
      + '<head><link></head>'
      + '<head><link></head>';
    const result = relSitemap(content);

    const $ = cheerio.load(result);
    $('link[rel="sitemap"]').length.should.eql(1);

    const expected = '<head></head>'
    + '<head><link><link rel="sitemap" type="application/xml" title="Sitemap" href="/sitemap.xml"></head>'
    + '<head><link></head>';
    result.should.eql(expected);
  });
});

describe('IDN', () => {
  it('Default', () => {
    const hexo = new Hexo(__dirname, {silent: true});
    hexo.config.baidusitemap = {
      path: 'sitemap.xml'
    };
    const Post = hexo.model('Post');
    const generator = require('../lib/generator').bind(hexo);

    hexo.config.url = 'http://fôo.com/bár';
    const parsedUrl = encodeURL(hexo.config.url);

    return hexo.init().then(() => {
      return Post.insert({
        source: 'foo', slug: 'foo', updated: 1e8
      });
    }).then(data => {
      const locals = hexo.locals.toObject();

      const result = generator(locals);
      const $ = cheerio.load(result.data);

      $('url').each((index, element) => {
        $(element).children('loc').text().startsWith(parsedUrl).should.be.true;
      });

      return Post.removeById(data._id);
    });
  });

  it('Encoded', () => {
    const hexo = new Hexo(__dirname, {silent: true});
    hexo.config.baidusitemap = {
      path: 'sitemap.xml'
    };
    const Post = hexo.model('Post');
    const generator = require('../lib/generator').bind(hexo);

    hexo.config.url = 'http://foo.com/b%C3%A1r';

    return hexo.init().then(() => {
      return Post.insert({
        source: 'foo', slug: 'foo', updated: 1e8
      });
    }).then(data => {
      const locals = hexo.locals.toObject();

      const result = generator(locals);
      const $ = cheerio.load(result.data);

      $('url').each((index, element) => {
        $(element).children('loc').text().startsWith(hexo.config.url).should.be.true;
      });

      return Post.removeById(data._id);
    });
  });
});
