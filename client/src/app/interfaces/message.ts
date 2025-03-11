export interface Message {
    content: string | null,
    isMine: boolean,
    imgURL: string | null,
    isJSON: boolean,
    senderId: string | null
}
