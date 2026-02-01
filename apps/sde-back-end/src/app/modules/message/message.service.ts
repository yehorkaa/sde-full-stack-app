import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Message, MessageDocument } from './schemas/message.schema';
import { CreateMessageDto, UpdateMessageDto, GetMessagesQueryDto } from './dto';

@Injectable()
export class MessageService {
  constructor(
    @InjectModel(Message.name)
    private readonly messageModel: Model<MessageDocument>
  ) {}

  async create(
    createMessageDto: CreateMessageDto,
    authorId: string
  ): Promise<MessageDocument> {
    const message = new this.messageModel({
      ...createMessageDto,
      authorId: new Types.ObjectId(authorId),
    });
    return message.save();
  }

  async findAll(queryDto: GetMessagesQueryDto) {
    const { tag, authorId, fromDate, toDate, cursor, limit = 20 } = queryDto;

    const query: Record<string, any> = {};

    if (cursor) {
      query._id = { $lt: new Types.ObjectId(cursor) };
    }

    if (tag) {
      query.tag = tag;
    }

    if (authorId) {
      query.authorId = new Types.ObjectId(authorId);
    }

    if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) {
        query.createdAt.$gte = new Date(fromDate);
      }
      if (toDate) {
        query.createdAt.$lte = new Date(toDate);
      }
    }

    const messages = await this.messageModel
      .find(query)
      .sort({ _id: -1 })
      .limit(limit + 1)
      .populate('authorId', 'name email _id')
      .exec();

    const hasMore = messages.length > limit;
    if (hasMore) {
      messages.pop();
    }

    return {
      messages: messages.map((m) => this.transformMessage(m)),
      nextCursor:
        messages.length > 0 ? messages[messages.length - 1]._id.toString() : null,
      hasMore,
    };
  }

  async findOne(id: string) {
    const message = await this.messageModel
      .findById(id)
      .populate('authorId', 'name email _id')
      .exec();

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    return this.transformMessage(message);
  }

  async update(id: string, userId: string, updateMessageDto: UpdateMessageDto) {
    const message = await this.messageModel.findById(id);

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.authorId.toString() !== userId) {
      throw new ForbiddenException('You can only edit your own messages');
    }

    const updated = await this.messageModel
      .findByIdAndUpdate(id, updateMessageDto, { new: true })
      .populate('authorId', 'name email _id')
      .exec();

    return this.transformMessage(updated!);
  }

  async remove(id: string, userId: string) {
    const message = await this.messageModel.findById(id);

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.authorId.toString() !== userId) {
      throw new ForbiddenException('You can only delete your own messages');
    }

    await this.messageModel.findByIdAndDelete(id);
    return { message: 'Message deleted successfully' };
  }

  private transformMessage(message: MessageDocument) {
    const plain = message.toObject();
    return {
      _id: plain._id.toString(),
      authorId: plain.authorId,
      content: plain.content,
      tag: plain.tag,
      createdAt: plain.createdAt.toISOString(),
      updatedAt: plain.updatedAt.toISOString(),
    };
  }
}
