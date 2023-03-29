export interface DOMMessage {
  event?: any;
  finding?: string;
  from?: string;
  html?: string;
  type?: 'GET_DOM';
  question?: string;
}

export interface DOMMessageResponse {
  title: string;
  headlines: string[];
}
