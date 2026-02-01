import { Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class RefreshTokenStorage {
  // In-memory storage for development
  // For production, use Redis
  private readonly tokens = new Map<string, string>();

  async insert(userId: string, tokenId: string): Promise<void> {
    this.tokens.set(this.getKey(userId, tokenId), tokenId);
  }

  async validate(userId: string, tokenId: string): Promise<boolean> {
    const storedId = this.tokens.get(this.getKey(userId, tokenId));
    if (storedId !== tokenId) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    return true;
  }

  async invalidate(userId: string, tokenId: string): Promise<void> {
    this.tokens.delete(this.getKey(userId, tokenId));
  }

  private getKey(userId: string, tokenId: string): string {
    return `user-${userId}-${tokenId}`;
  }
}
