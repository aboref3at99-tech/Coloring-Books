export interface Page {
  imageUrl: string;
  caption: string;
  captionEn?: string;
  coloredImageUrl?: string; // For digital coloring state
}

export interface SavedBook {
  id: string;
  theme: string;
  childName: string;
  pages?: Page[]; // Optional now, fetched separately
  thumbnailUrl?: string; // First page image for gallery
  createdAt: any;
  userId: string;
  isPublic?: boolean;
  avatarUrl?: string;
}

export type ImageSize = "1K" | "2K" | "4K";
export type AspectRatio = "1:1" | "2:3" | "3:2" | "3:4" | "4:3" | "9:16" | "16:9" | "21:9";

export interface Selection {
  x: number;
  y: number;
  w: number;
  h: number;
}
