const chokidar = require('chokidar');
const fs = require('fs');
const path = require('path');
var UglifyJS = require("uglify-js");
const readline = require("readline");


const watchJSDirPath = 'C:\\A-Information\\A-Work\\DataMipCRM_TaoBao\\DataMipCRM.Web\\bin\\publish\\Scripts';

const filePathCache = new Map();
let counter = 0;
let total = 0;

//创建readline接口实例
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/** 
 * 监控指定目录下所有js文件改动，并压缩
 * @Author: cp 
 * @Date: 2020-06-15 14:19:13 
 * @Desc:  
 */
rl.question("请输入需要压缩的路径（默认路径）：", answer => {

  if (!answer) answer = watchJSDirPath

  chokidar.watch(answer).on('all', (event, filePath) => {

    const { name, ext, base } = path.parse(filePath);

    // 过滤min文件
    if (name.includes('min')) return;
    // 过滤非js文件
    if (ext !== '.js') return;
    // 过滤处理过的文件
    if (filePathCache.has(filePath)) return;

    const fileContent = fs.readFileSync(filePath, 'utf8');

    filePathCache.set(filePath, '');

    const result = UglifyJS.minify(fileContent, {
      mangle: { toplevel: true },
      compress: true,
      output: {
        ascii_only: true, // 允许unicode字符串 
      },
    });

    if (!result.error && result.code) {
      total++;

      const fileContentHashCode = murmurhash3_32_gc(result.code);
      // 记录已经处理过的路径
      filePathCache.set(filePath, fileContentHashCode);

      fs.writeFile(filePath, result.code, 'utf8', (err) => {
        if (err) throw err;
        counter++;
        console.log(`${counter}.success-(${event})：`, filePath, fileContentHashCode)
      });
      console.log(`需要压缩文件：${total}个`);
      return;
    }

    console.error('compress error:', filePath, result)

  });

  rl.close();
})

/**
 * JS Implementation of MurmurHash3 (r136) (as of May 20, 2011)
 * 
 * @author <a href="mailto:gary.court@gmail.com">Gary Court</a>
 * @see http://github.com/garycourt/murmurhash-js
 * @author <a href="mailto:aappleby@gmail.com">Austin Appleby</a>
 * @see http://sites.google.com/site/murmurhash/
 * 
 * @param {string} key ASCII only
 * @param {number} seed Positive integer only
 * @return {number} 32-bit positive integer hash 
 */
function murmurhash3_32_gc (key, seed) {
  var remainder, bytes, h1, h1b, c1, c1b, c2, c2b, k1, i;

  remainder = key.length & 3; // key.length % 4
  bytes = key.length - remainder;
  h1 = seed;
  c1 = 0xcc9e2d51;
  c2 = 0x1b873593;
  i = 0;

  while (i < bytes) {
    k1 =
      ((key.charCodeAt(i) & 0xff)) |
      ((key.charCodeAt(++i) & 0xff) << 8) |
      ((key.charCodeAt(++i) & 0xff) << 16) |
      ((key.charCodeAt(++i) & 0xff) << 24);
    ++i;

    k1 = ((((k1 & 0xffff) * c1) + ((((k1 >>> 16) * c1) & 0xffff) << 16))) & 0xffffffff;
    k1 = (k1 << 15) | (k1 >>> 17);
    k1 = ((((k1 & 0xffff) * c2) + ((((k1 >>> 16) * c2) & 0xffff) << 16))) & 0xffffffff;

    h1 ^= k1;
    h1 = (h1 << 13) | (h1 >>> 19);
    h1b = ((((h1 & 0xffff) * 5) + ((((h1 >>> 16) * 5) & 0xffff) << 16))) & 0xffffffff;
    h1 = (((h1b & 0xffff) + 0x6b64) + ((((h1b >>> 16) + 0xe654) & 0xffff) << 16));
  }

  k1 = 0;

  switch (remainder) {
    case 3: k1 ^= (key.charCodeAt(i + 2) & 0xff) << 16;
    case 2: k1 ^= (key.charCodeAt(i + 1) & 0xff) << 8;
    case 1: k1 ^= (key.charCodeAt(i) & 0xff);

      k1 = (((k1 & 0xffff) * c1) + ((((k1 >>> 16) * c1) & 0xffff) << 16)) & 0xffffffff;
      k1 = (k1 << 15) | (k1 >>> 17);
      k1 = (((k1 & 0xffff) * c2) + ((((k1 >>> 16) * c2) & 0xffff) << 16)) & 0xffffffff;
      h1 ^= k1;
  }

  h1 ^= key.length;

  h1 ^= h1 >>> 16;
  h1 = (((h1 & 0xffff) * 0x85ebca6b) + ((((h1 >>> 16) * 0x85ebca6b) & 0xffff) << 16)) & 0xffffffff;
  h1 ^= h1 >>> 13;
  h1 = ((((h1 & 0xffff) * 0xc2b2ae35) + ((((h1 >>> 16) * 0xc2b2ae35) & 0xffff) << 16))) & 0xffffffff;
  h1 ^= h1 >>> 16;

  return h1 >>> 0;
}

