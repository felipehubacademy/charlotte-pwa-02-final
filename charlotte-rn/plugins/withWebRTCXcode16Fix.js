/**
 * Config plugin: Fix 'memory' file not found for react-native-webrtc on Xcode 16.
 *
 * Xcode 16 changed how the C++ stdlib <memory> header is resolved.
 * Setting CLANG_CXX_LANGUAGE_STANDARD=c++20 on the react-native-webrtc
 * pod target resolves the build error:
 *   'memory' file not found (in target 'react-native-webrtc' from project 'Pods')
 */

const { withDangerousMod } = require('expo/config-plugins');
const { readFileSync, writeFileSync } = require('fs');
const { join } = require('path');

const withWebRTCXcode16Fix = (config) => {
  return withDangerousMod(config, [
    'ios',
    (config) => {
      const podfilePath = join(config.modRequest.platformProjectRoot, 'Podfile');
      let contents = readFileSync(podfilePath, 'utf8');

      // Idempotency guard — don't double-inject
      const marker = '# webrtc-xcode16-fix';
      if (contents.includes(marker)) return config;

      const fixBlock = `
    ${marker}: CLANG_CXX_LANGUAGE_STANDARD=c++20 for Xcode 16 compatibility
    installer.pods_project.targets.each do |t|
      next unless t.name == 'react-native-webrtc'
      t.build_configurations.each do |cfg|
        cfg.build_settings['CLANG_CXX_LANGUAGE_STANDARD'] = 'c++20'
        cfg.build_settings['OTHER_CPLUSPLUSFLAGS'] = '$(inherited) -std=c++20'
      end
    end`;

      // Insert inside post_install block, just before its closing end + top-level end
      contents = contents.replace(/(\n  end\nend\n?)$/, `${fixBlock}\n$1`);

      writeFileSync(podfilePath, contents);
      return config;
    },
  ]);
};

module.exports = withWebRTCXcode16Fix;
