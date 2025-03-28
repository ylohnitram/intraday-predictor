"use client"

import { useEffect, useState } from "react"
import { Bitcoin, CircleDollarSign } from "lucide-react"
import Image from "next/image"

interface CryptoIconProps {
  symbol: string
  size?: number
  className?: string
}

// Mapování symbolů na ikony
const CRYPTO_ICONS: Record<string, string> = {
  BTC: "/crypto-icons/btc.svg",
  ETH: "/crypto-icons/eth.svg",
  SOL: "/crypto-icons/sol.svg",
  DOGE: "/crypto-icons/doge.svg",
  XRP: "/crypto-icons/xrp.svg",
  ADA: "/crypto-icons/ada.svg",
  DOT: "/crypto-icons/dot.svg",
  AVAX: "/crypto-icons/avax.svg",
  MATIC: "/crypto-icons/matic.svg",
  LINK: "/crypto-icons/link.svg",
  UNI: "/crypto-icons/uni.svg",
  SHIB: "/crypto-icons/shib.svg",
  LTC: "/crypto-icons/ltc.svg",
  ATOM: "/crypto-icons/atom.svg",
  FTM: "/crypto-icons/ftm.svg",
  NEAR: "/crypto-icons/near.svg",
  ALGO: "/crypto-icons/algo.svg",
  ICP: "/crypto-icons/icp.svg",
  EOS: "/crypto-icons/eos.svg",
  SAND: "/crypto-icons/sand.svg",
  MANA: "/crypto-icons/mana.svg",
  AXS: "/crypto-icons/axs.svg",
  FIL: "/crypto-icons/fil.svg",
  ETC: "/crypto-icons/etc.svg",
  AAVE: "/crypto-icons/aave.svg",
  EGLD: "/crypto-icons/egld.svg",
  XTZ: "/crypto-icons/xtz.svg",
  THETA: "/crypto-icons/theta.svg",
  XMR: "/crypto-icons/xmr.svg",
  CAKE: "/crypto-icons/cake.svg",
  NEO: "/crypto-icons/neo.svg",
  KSM: "/crypto-icons/ksm.svg",
  KLAY: "/crypto-icons/klay.svg",
  HBAR: "/crypto-icons/hbar.svg",
  FLOW: "/crypto-icons/flow.svg",
  CHZ: "/crypto-icons/chz.svg",
  WAVES: "/crypto-icons/waves.svg",
  ZEC: "/crypto-icons/zec.svg",
  ENJ: "/crypto-icons/enj.svg",
  DASH: "/crypto-icons/dash.svg",
  XEM: "/crypto-icons/xem.svg",
  COMP: "/crypto-icons/comp.svg",
  HOT: "/crypto-icons/hot.svg",
  BAT: "/crypto-icons/bat.svg",
  ZIL: "/crypto-icons/zil.svg",
  IOTA: "/crypto-icons/iota.svg",
  BTT: "/crypto-icons/btt.svg",
  ONE: "/crypto-icons/one.svg",
  CELO: "/crypto-icons/celo.svg",
  SNX: "/crypto-icons/snx.svg",
  GRT: "/crypto-icons/grt.svg",
  SUSHI: "/crypto-icons/sushi.svg",
  YFI: "/crypto-icons/yfi.svg",
  RVN: "/crypto-icons/rvn.svg",
  QTUM: "/crypto-icons/qtum.svg",
  ZRX: "/crypto-icons/zrx.svg",
  ICX: "/crypto-icons/icx.svg",
  ONT: "/crypto-icons/ont.svg",
  OMG: "/crypto-icons/omg.svg",
  ANKR: "/crypto-icons/ankr.svg",
  SC: "/crypto-icons/sc.svg",
  DGB: "/crypto-icons/dgb.svg",
  TFUEL: "/crypto-icons/tfuel.svg",
  NANO: "/crypto-icons/nano.svg",
  STORJ: "/crypto-icons/storj.svg",
  STMX: "/crypto-icons/stmx.svg",
  REEF: "/crypto-icons/reef.svg",
  AUDIO: "/crypto-icons/audio.svg",
  CTSI: "/crypto-icons/ctsi.svg",
  CELR: "/crypto-icons/celr.svg",
  SRM: "/crypto-icons/srm.svg",
  DENT: "/crypto-icons/dent.svg",
  SKL: "/crypto-icons/skl.svg",
  BAKE: "/crypto-icons/bake.svg",
  ALPHA: "/crypto-icons/alpha.svg",
  SXP: "/crypto-icons/sxp.svg",
  LUNA: "/crypto-icons/luna.svg",
  RUNE: "/crypto-icons/rune.svg",
  CRV: "/crypto-icons/crv.svg",
  IOTX: "/crypto-icons/iotx.svg",
  KAVA: "/crypto-icons/kava.svg",
  RSR: "/crypto-icons/rsr.svg",
  OCEAN: "/crypto-icons/ocean.svg",
  BNT: "/crypto-icons/bnt.svg",
  LRC: "/crypto-icons/lrc.svg",
  FTT: "/crypto-icons/ftt.svg",
  BAND: "/crypto-icons/band.svg",
  REN: "/crypto-icons/ren.svg",
  BAL: "/crypto-icons/bal.svg",
  KNC: "/crypto-icons/knc.svg",
  MTL: "/crypto-icons/mtl.svg",
  OGN: "/crypto-icons/ogn.svg",
  NKN: "/crypto-icons/nkn.svg",
  CVC: "/crypto-icons/cvc.svg",
  STPT: "/crypto-icons/stpt.svg",
  ARPA: "/crypto-icons/arpa.svg",
  TROY: "/crypto-icons/troy.svg",
  PERL: "/crypto-icons/perl.svg",
  TOMO: "/crypto-icons/tomo.svg",
  IRIS: "/crypto-icons/iris.svg",
  MKR: "/crypto-icons/mkr.svg",
  FET: "/crypto-icons/fet.svg",
  JST: "/crypto-icons/jst.svg",
  WIN: "/crypto-icons/win.svg",
  TRB: "/crypto-icons/trb.svg",
  WNXM: "/crypto-icons/wnxm.svg",
  TRX: "/crypto-icons/trx.svg",
  SUN: "/crypto-icons/sun.svg",
  VTHO: "/crypto-icons/vtho.svg",
  LINA: "/crypto-icons/lina.svg",
  PERP: "/crypto-icons/perp.svg",
  DODO: "/crypto-icons/dodo.svg",
  ALICE: "/crypto-icons/alice.svg",
  DYDX: "/crypto-icons/dydx.svg",
  GALA: "/crypto-icons/gala.svg",
  ILV: "/crypto-icons/ilv.svg",
  PEOPLE: "/crypto-icons/people.svg",
  ROSE: "/crypto-icons/rose.svg",
  IMX: "/crypto-icons/imx.svg",
  API3: "/crypto-icons/api3.svg",
  ENS: "/crypto-icons/ens.svg",
  GLMR: "/crypto-icons/glmr.svg",
  APE: "/crypto-icons/ape.svg",
  GMT: "/crypto-icons/gmt.svg",
  OP: "/crypto-icons/op.svg",
  ARB: "/crypto-icons/arb.svg",
  BLUR: "/crypto-icons/blur.svg",
  PEPE: "/crypto-icons/pepe.svg",
  SUI: "/crypto-icons/sui.svg",
  SEI: "/crypto-icons/sei.svg",
  TIA: "/crypto-icons/tia.svg",
  JTO: "/crypto-icons/jto.svg",
  BONK: "/crypto-icons/bonk.svg",
  STRK: "/crypto-icons/strk.svg",
  ORDI: "/crypto-icons/ordi.svg",
  PYTH: "/crypto-icons/pyth.svg",
  WIF: "/crypto-icons/wif.svg",
  RNDR: "/crypto-icons/rndr.svg",
  INJ: "/crypto-icons/inj.svg",
  CYBER: "/crypto-icons/cyber.svg",
  MEME: "/crypto-icons/meme.svg",
  PENDLE: "/crypto-icons/pendle.svg",
  AGIX: "/crypto-icons/agix.svg",
  FET: "/crypto-icons/fet.svg",
  OCEAN: "/crypto-icons/ocean.svg",
  ONDO: "/crypto-icons/ondo.svg",
  AEVO: "/crypto-icons/aevo.svg",
  ETHFI: "/crypto-icons/ethfi.svg",
  NEIRO: "/crypto-icons/neiro.svg",
  PIXEL: "/crypto-icons/pixel.svg",
  TAKI: "/crypto-icons/taki.svg",
  ZETA: "/crypto-icons/zeta.svg",
  BIGTIME: "/crypto-icons/bigtime.svg",
  BEAM: "/crypto-icons/beam.svg",
}

export function CryptoIcon({ symbol, size = 16, className = "" }: CryptoIconProps) {
  const [error, setError] = useState(false)
  const [loaded, setLoaded] = useState(false)

  // Resetovat stav při změně symbolu
  useEffect(() => {
    setError(false)
    setLoaded(false)
  }, [symbol])

  // Normalizovat symbol pro vyhledávání
  const normalizedSymbol = symbol.toUpperCase().replace("USDT", "").replace(".P", "")

  // Zkontrolovat, zda máme ikonu pro tento symbol
  const iconPath = CRYPTO_ICONS[normalizedSymbol]

  // Pokud nemáme ikonu nebo došlo k chybě, zobrazit fallback
  if (!iconPath || error) {
    if (normalizedSymbol === "BTC") {
      return <Bitcoin size={size} className={`text-amber-500 ${className}`} />
    }
    return <CircleDollarSign size={size} className={`text-gray-400 ${className}`} />
  }

  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-3/4 h-3/4 rounded-full animate-pulse bg-gray-300 dark:bg-gray-700"></div>
        </div>
      )}
      <Image
        src={iconPath || "/placeholder.svg"}
        alt={symbol}
        width={size}
        height={size}
        className={`rounded-full ${loaded ? "opacity-100" : "opacity-0"}`}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
      />
    </div>
  )
}

