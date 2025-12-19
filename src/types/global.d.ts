declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any
  }
}

declare module 'qrcode-svg' {
  const QRCode: any
  export default QRCode
}

