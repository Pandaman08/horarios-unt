declare module 'html-to-pdfmake' {
  interface HtmlToPdfmakeOptions {
    defaultStyles?: Record<string, any>;
    tableAutoSize?: boolean;
    removeExtraBlanks?: boolean;
    window?: any;
  }

  interface PdfMakeNode {
    [key: string]: any;
  }

  function htmlToPdfmake(
    html: string,
    options?: HtmlToPdfmakeOptions
  ): PdfMakeNode[];

  export = htmlToPdfmake;
}
