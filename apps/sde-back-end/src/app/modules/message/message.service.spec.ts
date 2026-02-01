/// <reference types="jest" />
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { MessageService } from './message.service';
import { Message } from './schemas/message.schema';
import { MessageTag } from '@sde-challenge/shared-types';

describe('MessageService', () => {
  let service: MessageService;
  let mockMessageModel: any;

  const mockUser1Id = new Types.ObjectId().toString();
  const mockUser2Id = new Types.ObjectId().toString();
  const mockMessageId = new Types.ObjectId().toString();

  const mockMessage = {
    _id: new Types.ObjectId(mockMessageId),
    authorId: new Types.ObjectId(mockUser1Id),
    content: 'Test message content',
    tag: MessageTag.GENERAL,
    createdAt: new Date(),
    updatedAt: new Date(),
    toObject: function () {
      return {
        _id: this._id,
        authorId: this.authorId,
        content: this.content,
        tag: this.tag,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt,
      };
    },
  };

  beforeEach(async () => {
    mockMessageModel = {
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      exec: jest.fn(),
    };

    // Setup chainable methods
    mockMessageModel.findById.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockMessage),
      }),
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessageService,
        {
          provide: getModelToken(Message.name),
          useValue: mockMessageModel,
        },
      ],
    }).compile();

    service = module.get<MessageService>(MessageService);
  });

  describe('update', () => {
    it('should throw ForbiddenException when user is not the author', async () => {
      // Arrange: findById returns message owned by user1
      mockMessageModel.findById.mockResolvedValue({
        ...mockMessage,
        authorId: {
          toString: () => mockUser1Id,
        },
      });

      // Act & Assert: user2 tries to update
      await expect(
        service.update(mockMessageId, mockUser2Id, { content: 'Updated content' })
      ).rejects.toThrow(ForbiddenException);

      expect(mockMessageModel.findById).toHaveBeenCalledWith(mockMessageId);
    });

    it('should throw NotFoundException when message does not exist', async () => {
      // Arrange: findById returns null
      mockMessageModel.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.update(mockMessageId, mockUser1Id, { content: 'Updated content' })
      ).rejects.toThrow(NotFoundException);
    });

    it('should successfully update when user is the author', async () => {
      // Arrange
      const updatedMessage = {
        ...mockMessage,
        content: 'Updated content',
        toObject: mockMessage.toObject,
      };

      mockMessageModel.findById.mockResolvedValue({
        ...mockMessage,
        authorId: {
          toString: () => mockUser1Id,
        },
      });

      mockMessageModel.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(updatedMessage),
        }),
      });

      // Act
      const result = await service.update(mockMessageId, mockUser1Id, {
        content: 'Updated content',
      });

      // Assert
      expect(result.content).toBe('Updated content');
      expect(mockMessageModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockMessageId,
        { content: 'Updated content' },
        { new: true }
      );
    });
  });

  describe('remove', () => {
    it('should throw ForbiddenException when user is not the author', async () => {
      // Arrange
      mockMessageModel.findById.mockResolvedValue({
        ...mockMessage,
        authorId: {
          toString: () => mockUser1Id,
        },
      });

      // Act & Assert
      await expect(service.remove(mockMessageId, mockUser2Id)).rejects.toThrow(
        ForbiddenException
      );
    });

    it('should throw NotFoundException when message does not exist', async () => {
      // Arrange
      mockMessageModel.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.remove(mockMessageId, mockUser1Id)).rejects.toThrow(
        NotFoundException
      );
    });

    it('should successfully delete when user is the author', async () => {
      // Arrange
      mockMessageModel.findById.mockResolvedValue({
        ...mockMessage,
        authorId: {
          toString: () => mockUser1Id,
        },
      });
      mockMessageModel.findByIdAndDelete.mockResolvedValue(mockMessage);

      // Act
      const result = await service.remove(mockMessageId, mockUser1Id);

      // Assert
      expect(result).toEqual({ message: 'Message deleted successfully' });
      expect(mockMessageModel.findByIdAndDelete).toHaveBeenCalledWith(
        mockMessageId
      );
    });
  });
});
