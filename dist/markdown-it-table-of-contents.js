/*! markdown-it-table-of-contents 0.4.4-3 https://github.com//GerHobbelt/markdown-it-table-of-contents @license MIT */

(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.markdownitTableOfContents = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict';

const slugify = (s) => encodeURIComponent(String(s).trim().toLowerCase().replace(/\s+/g, '-'));

const defaults = {
  includeLevel: [ 1, 2, 3, 4 ],
  containerClass: 'table-of-contents',
  slugify,
  markerPattern: /^\[\[toc\]\]/im,
  listType: 'ul',
  format: undefined,
  forceFullToc: false,
  containerHeaderHtml: undefined,
  containerFooterHtml: undefined,
  transformLink: undefined
};

module.exports = (md, o) => {
  const options = Object.assign({}, defaults, o);
  const tocRegexp = options.markerPattern;
  let gstate;

  function toc(state, silent) {
    let token;
    let match;

    // Reject if the token does not start with [
    if (state.src.charCodeAt(state.pos) !== 0x5B /* [ */) {
      return false;
    }
    // Don't run any pairs in validation mode
    if (silent) {
      return false;
    }

    // Detect TOC markdown
    match = tocRegexp.exec(state.src.substr(state.pos));
    match = !match ? [] : match.filter(function (m) { return m; });
    if (match.length < 1) {
      return false;
    }

    // Build content
    token = state.push('toc_open', 'toc', 1);
    token.markup = '[[toc]]';
    token = state.push('toc_body', '', 0);
    token = state.push('toc_close', 'toc', -1);

    // Update pos so the parser can continue
    let newline = state.src.indexOf('\n', state.pos);
    if (newline !== -1) {
      state.pos = newline;
    } else {
      state.pos = state.pos + state.posMax + 1;
    }

    return true;
  }

  md.renderer.rules.toc_open = function (tokens, index) {
    let tocOpenHtml = `<div class="${options.containerClass}">`;

    if (options.containerHeaderHtml) {
      tocOpenHtml += options.containerHeaderHtml;
    }

    return tocOpenHtml;
  };

  md.renderer.rules.toc_close = function (tokens, index) {
    let tocFooterHtml = '';

    if (options.containerFooterHtml) {
      tocFooterHtml = options.containerFooterHtml;
    }

    return tocFooterHtml + '</div>';
  };

  md.renderer.rules.toc_body = function (tokens, index) {
    if (options.forceFullToc) {
      /*

      Renders full TOC even if the hierarchy of headers contains
      a header greater than the first appearing header

      ## heading 2
      ### heading 3
      # heading 1

      Result TOC:
      - heading 2
         - heading 3
      - heading 1

      */
      let tocBody = '';
      let pos = 0;
      let tokenLength = gstate && gstate.tokens && gstate.tokens.length;

      while (pos < tokenLength) {
        let tocHierarchy = renderChildsTokens(pos, gstate.tokens);
        pos = tocHierarchy[0];
        tocBody += tocHierarchy[1];
      }

      return tocBody;
    }
    return renderChildsTokens(0, gstate.tokens)[1];

  };

  function renderChildsTokens(pos, tokens) {
    let headings = [],
        buffer = '',
        currentLevel,
        subHeadings,
        size = tokens.length,
        i = pos;
    while (i < size) {
      let token = tokens[i];
      let heading = tokens[i - 1];
      let level = token.tag && parseInt(token.tag.substr(1, 1), 10);
      if (token.type !== 'heading_close' || options.includeLevel.indexOf(level) === -1 || heading.type !== 'inline') {
        i++; continue; // Skip if not matching criteria
      }
      if (!currentLevel) {
        currentLevel = level;// We init with the first found level
      } else {
        if (level > currentLevel) {
          subHeadings = renderChildsTokens(i, tokens);
          buffer += subHeadings[1];
          i = subHeadings[0];
          continue;
        }
        if (level < currentLevel) {
          // Finishing the sub headings
          buffer += '</li>';
          headings.push(buffer);
          return [ i, `<${options.listType}>${headings.join('')}</${options.listType}>` ];
        }
        if (level === currentLevel) {
          // Finishing the sub headings
          buffer += '</li>';
          headings.push(buffer);
        }
      }
      let content = heading.children
        .filter(token => token.type === 'text' || token.type === 'code_inline')
        .reduce((acc, t) => acc + t.content, '');
      let slugifiedContent = options.slugify(content);
      let link = '#' + slugifiedContent;
      if (options.transformLink) {
        link = options.transformLink(link, content);
      }
      buffer = `<li><a href="${link}">`;
      buffer += typeof options.format === 'function' ? options.format(content) : content;
      buffer += '</a>';
      i++;
    }
    buffer += buffer === '' ? '' : '</li>';
    headings.push(buffer);
    return [ i, `<${options.listType}>${headings.join('')}</${options.listType}>` ];
  }

  // Catch all the tokens for iteration later
  md.core.ruler.push('grab_state', function (state) {
    gstate = state;
  });

  // Insert TOC
  md.inline.ruler.after('emphasis', 'toc', toc);
};

},{}]},{},[1])(1)
});
