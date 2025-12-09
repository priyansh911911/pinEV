declare module 'react-qr-scanner' {
  import { Component } from 'react';

  interface QrScannerProps {
    delay?: number;
    onError?: (error: any) => void;
    onScan?: (result: any, error: any) => void;
    style?: React.CSSProperties;
    className?: string;
    facingMode?: 'user' | 'environment';
    resolution?: number;
    showViewFinder?: boolean;
  }

  export default class QrScanner extends Component<QrScannerProps> {}
}