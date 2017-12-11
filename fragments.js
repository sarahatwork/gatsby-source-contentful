"use strict";

exports.__esModule = true;
/* eslint-disable */
var contentfulAssetResolutions = exports.contentfulAssetResolutions = graphql`
  fragment GatsbyContentfulResolutions on ContentfulResolutions {
    base64
    width
    height
    src
    srcSet
  }
`;

var contentfulAssetResolutionsNoBase64 = exports.contentfulAssetResolutionsNoBase64 = graphql`
  fragment GatsbyContentfulResolutions_noBase64 on ContentfulResolutions {
    width
    height
    src
    srcSet
  }
`;

var contentfulAssetSizes = exports.contentfulAssetSizes = graphql`
  fragment GatsbyContentfulSizes on ContentfulSizes {
    base64
    aspectRatio
    src
    srcSet
    sizes
  }
`;

var contentfulAssetSizesNoBase64 = exports.contentfulAssetSizesNoBase64 = graphql`
  fragment GatsbyContentfulSizes_noBase64 on ContentfulSizes {
    aspectRatio
    src
    srcSet
    sizes
  }
`;