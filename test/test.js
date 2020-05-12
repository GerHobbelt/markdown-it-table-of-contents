'use strict';

/*eslint-env mocha*/

let assert = require('assert');
let fs = require('fs');
let MarkdownIt = require('@gerhobbelt/markdown-it');
let markdownItAnchor = require('@gerhobbelt/markdown-it-anchor');
let markdownItTOC = require('../');

// Defaults
let defaultContainerClass = 'table-of-contents';
let defaultMarker = '[[toc]]';
let defaultListType = 'ul';
let defaultHeading1 = 'Sub heading 1';

// Fixtures
let simpleMarkdown = fs.readFileSync('test/fixtures/simple.md', 'utf-8');
let simpleDefaultHTML = fs.readFileSync('test/fixtures/simple-default.html', 'utf-8');
let simple1LevelHTML = fs.readFileSync('test/fixtures/simple-1-level.html', 'utf-8');
let simpleWithAnchorsHTML = fs.readFileSync('test/fixtures/simple-with-anchors.html', 'utf-8');
let simpleWithHeaderFooterHTML = fs.readFileSync('test/fixtures/simple-with-header-footer.html', 'utf-8');
let simpleWithTransformLink = fs.readFileSync('test/fixtures/simple-with-transform-link.html', 'utf-8');
let emptyMarkdown = defaultMarker;
let emptyMarkdownHtml = fs.readFileSync('test/fixtures/empty.html', 'utf-8');
let fullTocSampleMarkdown = fs.readFileSync('test/fixtures/full-toc-sample.md', 'utf-8');
let fullTocSampleHtml = fs.readFileSync('test/fixtures/full-toc-sample-result.html', 'utf-8');

const slugify = (s) => encodeURIComponent(String(s).trim().toLowerCase().replace(/\s+/g, '-'));

describe('Testing Markdown rendering', function () {
  let md = new MarkdownIt();

  it('Parses correctly with default settings', function (done) {
    md.use(markdownItTOC);
    assert.equal(md.render(simpleMarkdown), simpleDefaultHTML);
    done();
  });

  it('Parses correctly with includeLevel set', function (done) {
    md.use(markdownItTOC, {
      includeLevel: [ 2 ]
    });
    assert.equal(md.render(simpleMarkdown), simple1LevelHTML);
    done();
  });

  it('Parses correctly with containerClass set', function (done) {
    let customContainerClass = 'custom-container-class';
    md.use(markdownItTOC, {
      containerClass: customContainerClass
    });
    assert.equal(md.render(simpleMarkdown), simpleDefaultHTML.replace(defaultContainerClass, customContainerClass));
    done();
  });

  it('Parses correctly with markerPattern set', function (done) {
    let customMarker = '[[custom-marker]]';
    md.use(markdownItTOC, {
      markerPattern: /^\[\[custom-marker\]\]/im
    });
    assert.equal(md.render(simpleMarkdown.replace(defaultMarker, customMarker)), simpleDefaultHTML);
    done();
  });

  it('Parses correctly with listType set', function (done) {
    let customListType = 'ol';
    md.use(markdownItTOC, {
      listType: customListType
    });
    assert.equal(md.render(simpleMarkdown), simpleDefaultHTML.replace(new RegExp(defaultListType, 'g'), customListType));
    done();
  });

  it('Parses correctly with custom formatting', function (done) {
    let customHeading = 'Test';
    md.use(markdownItTOC, {
      format: function (str) {
        if (str === defaultHeading1) {
          return customHeading;
        }
        return str;
      }
    });
    assert.equal(md.render(simpleMarkdown), simpleDefaultHTML.replace(defaultHeading1, customHeading));
    done();
  });

  it('Slugs matches markdown-it-anchor', function (done) {
    md.use(markdownItAnchor);
    md.use(markdownItTOC);
    assert.equal(md.render(simpleMarkdown), simpleWithAnchorsHTML);
    done();
  });

  it('Generates empty TOC', function (done) {
    md.use(markdownItTOC);
    assert.equal(md.render(emptyMarkdown), emptyMarkdownHtml);
    done();
  });

  it('Generates full TOC, even when there is a greater header than the first header', function (done) {
    md.use(markdownItTOC, { forceFullToc: true });
    assert.equal(md.render(fullTocSampleMarkdown), fullTocSampleHtml);
    done();
  });

  it('Parses correctly with container header and footer html set', function (done) {
    md.use(markdownItTOC,
      {
        slugify,
        containerHeaderHtml: '<div class="header">Contents</div>',
        containerFooterHtml: '<div class="footer">Footer</div>'
      });
    assert.equal(md.render(simpleMarkdown), simpleWithHeaderFooterHTML);
    done();
  });

  it('Generates TOC, with custom transformed link', function (done) {
    md.use(markdownItTOC,
      {
        slugify,
        transformLink: (href) => {
          return href + '&type=test';
        }
      });
    assert.equal(md.render(simpleMarkdown), simpleWithTransformLink);
    done();
  });
});
