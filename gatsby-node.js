"use strict";

var _regenerator = require("babel-runtime/regenerator");

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _ = require(`lodash`);
var fs = require(`fs-extra`);

var normalize = require(`./normalize`);
var fetchData = require(`./fetch`);

var conflictFieldPrefix = `contentful`;

// restrictedNodeFields from here https://www.gatsbyjs.org/docs/node-interface/
var restrictedNodeFields = [`id`, `children`, `parent`, `fields`, `internal`];

exports.setFieldsOnGraphQLNodeType = require(`./extend-node-type`).extendNodeType;

/***
 * Localization algorithm
 *
 * 1. Make list of all resolvable IDs worrying just about the default ids not
 * localized ids
 * 2. Make mapping between ids, again not worrying about localization.
 * 3. When creating entries and assets, make the most localized version
 * possible for each localized node i.e. get the localized field if it exists
 * or the fallback field or the default field.
 */

exports.sourceNodes = function () {
  var _ref3 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(_ref, _ref2) {
    var boundActionCreators = _ref.boundActionCreators,
        getNodes = _ref.getNodes,
        hasNodeChanged = _ref.hasNodeChanged,
        store = _ref.store;
    var spaceId = _ref2.spaceId,
        accessToken = _ref2.accessToken,
        host = _ref2.host;

    var createNode, deleteNodes, touchNode, setPluginStatus, syncToken, _ref4, currentSyncData, contentTypeItems, defaultLocale, locales, entryList, existingNodes, assets, nextSyncToken, newState, resolvable, foreignReferenceMap, newOrUpdatedEntries;

    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            createNode = boundActionCreators.createNode, deleteNodes = boundActionCreators.deleteNodes, touchNode = boundActionCreators.touchNode, setPluginStatus = boundActionCreators.setPluginStatus;


            host = host || `cdn.contentful.com`;
            // Get sync token if it exists.
            syncToken = void 0;

            if (store.getState().status.plugins && store.getState().status.plugins[`gatsby-source-contentful`] && store.getState().status.plugins[`gatsby-source-contentful`][spaceId]) {
              syncToken = store.getState().status.plugins[`gatsby-source-contentful`][spaceId];
            }

            _context.next = 6;
            return fetchData({
              syncToken,
              spaceId,
              accessToken,
              host
            });

          case 6:
            _ref4 = _context.sent;
            currentSyncData = _ref4.currentSyncData;
            contentTypeItems = _ref4.contentTypeItems;
            defaultLocale = _ref4.defaultLocale;
            locales = _ref4.locales;
            entryList = normalize.buildEntryList({
              currentSyncData,
              contentTypeItems
            });

            // Remove deleted entries & assets.
            // TODO figure out if entries referencing now deleted entries/assets
            // are "updated" so will get the now deleted reference removed.

            deleteNodes(currentSyncData.deletedEntries.map(function (e) {
              return e.sys.id;
            }));
            deleteNodes(currentSyncData.deletedAssets.map(function (e) {
              return e.sys.id;
            }));

            existingNodes = getNodes().filter(function (n) {
              return n.internal.owner === `gatsby-source-contentful`;
            });

            existingNodes.forEach(function (n) {
              return touchNode(n.id);
            });

            assets = currentSyncData.assets;


            console.log(`Updated entries `, currentSyncData.entries.length);
            console.log(`Deleted entries `, currentSyncData.deletedEntries.length);
            console.log(`Updated assets `, currentSyncData.assets.length);
            console.log(`Deleted assets `, currentSyncData.deletedAssets.length);
            console.timeEnd(`Fetch Contentful data`);

            // Update syncToken
            nextSyncToken = currentSyncData.nextSyncToken;

            // Store our sync state for the next sync.
            // TODO: we do not store the token if we are using preview, since only initial sync is possible there
            // This might change though

            if (host !== `preview.contentful.com`) {
              newState = {};

              newState[spaceId] = nextSyncToken;
              setPluginStatus(newState);
            }

            // Create map of resolvable ids so we can check links against them while creating
            // links.
            resolvable = normalize.buildResolvableSet({
              existingNodes,
              entryList,
              assets,
              defaultLocale,
              locales
            });

            // Build foreign reference map before starting to insert any nodes

            foreignReferenceMap = normalize.buildForeignReferenceMap({
              contentTypeItems,
              entryList,
              resolvable,
              defaultLocale,
              locales
            });
            newOrUpdatedEntries = [];

            entryList.forEach(function (entries) {
              entries.forEach(function (entry) {
                newOrUpdatedEntries.push(entry.sys.id);
              });
            });

            // Update existing entry nodes that weren't updated but that need reverse
            // links added.
            Object.keys(foreignReferenceMap);
            existingNodes.filter(function (n) {
              return _.includes(newOrUpdatedEntries, n.id);
            }).forEach(function (n) {
              if (foreignReferenceMap[n.id]) {
                foreignReferenceMap[n.id].forEach(function (foreignReference) {
                  // Add reverse links
                  if (n[foreignReference.name]) {
                    n[foreignReference.name].push(foreignReference.id);
                    // It might already be there so we'll uniquify after pushing.
                    n[foreignReference.name] = _.uniq(n[foreignReference.name]);
                  } else {
                    // If is one foreign reference, there can always be many.
                    // Best to be safe and put it in an array to start with.
                    n[foreignReference.name] = [foreignReference.id];
                  }
                });
              }
            });

            contentTypeItems.forEach(function (contentTypeItem, i) {
              normalize.createContentTypeNodes({
                contentTypeItem,
                restrictedNodeFields,
                conflictFieldPrefix,
                entries: entryList[i],
                createNode,
                resolvable,
                foreignReferenceMap,
                defaultLocale,
                locales
              });
            });

            assets.forEach(function (assetItem) {
              normalize.createAssetNodes({
                assetItem,
                createNode,
                defaultLocale,
                locales
              });
            });

            return _context.abrupt("return");

          case 33:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, undefined);
  }));

  return function (_x, _x2) {
    return _ref3.apply(this, arguments);
  };
}();

// Check if there are any ContentfulAsset nodes and if gatsby-image is installed. If so,
// add fragments for ContentfulAsset and gatsby-image. The fragment will cause an error
// if there's not ContentfulAsset nodes and without gatsby-image, the fragment is useless.
exports.onPreExtractQueries = function () {
  var _ref6 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2(_ref5) {
    var store = _ref5.store,
        getNodes = _ref5.getNodes,
        boundActionCreators = _ref5.boundActionCreators;
    var program, nodes, gatsbyImageDoesNotExist;
    return _regenerator2.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            program = store.getState().program;
            nodes = getNodes();

            if (nodes.some(function (n) {
              return n.internal.type === `ContentfulAsset`;
            })) {
              _context2.next = 4;
              break;
            }

            return _context2.abrupt("return");

          case 4:
            gatsbyImageDoesNotExist = true;

            try {
              require.resolve(`gatsby-image`);
              gatsbyImageDoesNotExist = false;
            } catch (e) {
              // Ignore
            }

            if (!gatsbyImageDoesNotExist) {
              _context2.next = 8;
              break;
            }

            return _context2.abrupt("return");

          case 8:
            _context2.next = 10;
            return fs.copy(require.resolve(`gatsby-source-contentful/src/fragments.js`), `${program.directory}/.cache/fragments/contentful-asset-fragments.js`);

          case 10:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2, undefined);
  }));

  return function (_x3) {
    return _ref6.apply(this, arguments);
  };
}();