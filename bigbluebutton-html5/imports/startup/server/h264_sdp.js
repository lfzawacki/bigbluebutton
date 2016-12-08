/*
 * A module with the sole purpose of removing all non h264 options from an sdpOffer
 *
 * We use this to prevent any transcoding from the Kurento side if Firefox or Chrome offer VP8/VP9 as
 * the default format.
 */

import sdpTransform from 'sdp-transform';

exports.transform = (sdp) => {

  var res = sdpTransform.parse(sdp);

  // Audio
  res.media[0].rtp = res.media[0].rtp.filter(function(elem) {
    return elem.codec == 'opus';
  });

  var validPayloads = res.media[0].rtp.map(function(elem) {
    return elem.payload;
  });

  res.media[0].fmtp = res.media[0].fmtp.filter(function(elem) {
    return validPayloads.indexOf(elem.payload) >= 0;
  });

  res.media[0].payloads = validPayloads.join(' ');

  // Video
  res.media[1].rtp = res.media[1].rtp.filter(function(elem) {
    return elem.codec == 'H264';
  });

  validPayloads = res.media[1].rtp.map(function(elem) {
    return elem.payload;
  });

  res.media[1].fmtp = res.media[1].fmtp.filter(function(elem) {
    return validPayloads.indexOf(elem.payload) >= 0;
  });

  res.media[1].rtcpFb = res.media[1].rtcpFb.filter(function(elem) {
    return validPayloads.indexOf(elem.payload) >= 0;
  });

  res.media[1].payloads = validPayloads.join(' ');

  return sdpTransform.write(res);
};

