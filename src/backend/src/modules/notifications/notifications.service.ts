// @nestjs/common v9.0.0
import { Injectable } from '@nestjs/common';
// @nestjs/typeorm v9.0.0
import { InjectRepository } from '@nestjs/typeorm';
// typeorm v0.3.0
import { Repository } from 'typeorm';
// @nestjs/bull v0.6.0
import { InjectQueue } from '@nestjs/bull';
// bull v4.10.0
import { Queue } from 'bull';

import { Notification } from './entities/notification.entity';
import { CreateNotificationDto, NotificationType, NotificationPriority } from './dto/create-notification.dto';

/**
 * Human Tasks:
 * 1. Configure FCM/APNS credentials in environment variables
 * 2. Set up monitoring for notification delivery metrics
 * 3. Configure notification retention and archival policies
 * 4. Set up rate limiting for notification endpoints
 * 5. Configure database indexes for optimal querying
 */

/**
 * Service class that handles notification management, delivery, and persistence
 * 
 * Requirements addressed:
 * - Real-time notification system (Technical Specification/1.1 System Overview)
 *   Implements core notification functionality with real-time delivery capabilities
 * 
 * - Push Notification Services (Technical Specification/5.1 High-Level Architecture Overview)
 *   Manages FCM/APNS integration with priority-based delivery and scheduling
 * 
 * - Notification Service (Technical Specification/5.2.3 Service Layer Architecture)
 *   Provides comprehensive notification management and tracking capabilities
 */
@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectQueue('notifications')
    private readonly notificationQueue: Queue
  ) {}

  /**
   * Creates a new notification and queues it for delivery based on priority
   * 
   * @param createNotificationDto - DTO containing notification details
   * @returns Created notification entity with tracking details
   */
  async create(createNotificationDto: CreateNotificationDto): Promise<Notification> {
    // Create notification entity from DTO
    const notification = this.notificationRepository.create({
      ...createNotificationDto,
      data: createNotificationDto.data ? JSON.parse(createNotificationDto.data) : null
    });

    // Save notification to database
    await this.notificationRepository.save(notification);

    // Determine job options based on priority
    const jobOptions = {
      priority: this.getPriorityLevel(notification.priority),
      delay: notification.scheduledAt ? 
        new Date(notification.scheduledAt).getTime() - Date.now() : 
        0,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000
      },
      removeOnComplete: true
    };

    // Queue notification for delivery
    await this.notificationQueue.add(
      'send-notification',
      {
        notificationId: notification.id,
        userId: notification.userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data
      },
      jobOptions
    );

    return notification;
  }

  /**
   * Retrieves all notifications for a user with pagination and sorting
   * 
   * @param userId - ID of the user
   * @returns List of user notifications sorted by creation date
   */
  async findAll(userId: string): Promise<Notification[]> {
    return this.notificationRepository.find({
      where: { userId },
      order: {
        createdAt: 'DESC'
      }
    });
  }

  /**
   * Retrieves unread notifications for a user with priority sorting
   * 
   * @param userId - ID of the user
   * @returns List of unread notifications sorted by priority
   */
  async findUnread(userId: string): Promise<Notification[]> {
    return this.notificationRepository.find({
      where: {
        userId,
        isRead: false
      },
      order: {
        priority: 'DESC',
        createdAt: 'DESC'
      }
    });
  }

  /**
   * Marks a notification as read and updates tracking information
   * 
   * @param id - ID of the notification to mark as read
   * @returns Updated notification with read status
   */
  async markAsRead(id: string): Promise<Notification> {
    const notification = await this.notificationRepository.findOneOrFail({
      where: { id }
    });

    notification.isRead = true;
    notification.readAt = new Date();

    return this.notificationRepository.save(notification);
  }

  /**
   * Deletes a notification and removes it from the queue if pending
   * 
   * @param id - ID of the notification to delete
   */
  async delete(id: string): Promise<void> {
    const notification = await this.notificationRepository.findOneOrFail({
      where: { id }
    });

    // Remove from queue if not sent yet
    if (!notification.sentAt) {
      const jobs = await this.notificationQueue.getJobs(['waiting', 'delayed']);
      const pendingJob = jobs.find(job => 
        job.data.notificationId === notification.id
      );
      if (pendingJob) {
        await pendingJob.remove();
      }
    }

    await this.notificationRepository.remove(notification);
  }

  /**
   * Maps notification priority to Bull queue priority level
   * 
   * @param priority - Notification priority enum value
   * @returns Numeric priority level for Bull queue
   */
  private getPriorityLevel(priority: NotificationPriority): number {
    const priorityMap = {
      [NotificationPriority.URGENT]: 1,
      [NotificationPriority.HIGH]: 2,
      [NotificationPriority.MEDIUM]: 3,
      [NotificationPriority.LOW]: 4
    };
    return priorityMap[priority];
  }
}