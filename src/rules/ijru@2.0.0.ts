import type { Ruleset } from '.'

const ruleset: Ruleset = {
  id: 'ijru@2.0.0',
  name: 'IJRU v2.0.0',
  competitionEvents: {
    'e.ijru.sp.sr.srss.1.30': { name: 'Single Rope Speed Sprint' },
    'e.ijru.sp.sr.srse.1.180': { name: 'Single Rope Speed Endurance' },
    'e.ijru.sp.sr.srtu.1.0': { name: 'Single Rope Triple Unders' },
    'e.ijru.fs.sr.srif.1.75': { name: 'Single Rope Individual Freestyle' },

    'e.ijru.sp.sr.srsr.4.4x30': { name: 'Single Rope Speed Relay' },
    'e.ijru.sp.sr.srdr.2.2x30': { name: 'Single Rope Double Unders Relay' },
    'e.ijru.sp.dd.ddsr.4.4x30': { name: 'Double Dutch Speed Relay' },
    'e.ijru.sp.dd.ddss.3.60': { name: 'Double Dutch Speed Sprint' },

    'e.ijru.fs.sr.srpf.2.75': { name: 'Single Rope Pair Freestyle' },
    'e.ijru.fs.sr.srtf.4.75': { name: 'Single Rope Team Freestyle' },
    'e.ijru.fs.dd.ddsf.3.75': { name: 'Double Dutch Single Freestyle' },
    'e.ijru.fs.dd.ddpf.4.75': { name: 'Double Dutch Pair Freestyle' },
    'e.ijru.fs.dd.ddtf.5.90': { name: 'Double Dutch Triad Freestyle' },
    'e.ijru.fs.wh.whpf.2.75': { name: 'Wheel Pair Freestyle' }
    // 'e.ijru.fs.ts.sctf.8.300': { name: 'Show Freestyle' }
  }
}

export default ruleset
