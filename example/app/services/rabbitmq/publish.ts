import { Service } from 'typedi';
import { EggBaseService } from 'egg-typeorm-graphql';

@Service()
export default class RBMQPublishService extends EggBaseService {
  /**
   * 获取交换机和队列配置信息
   * @param exchangeName
   * @param queueName
   */
  getQueueInfo(exchangeName, queueName) {
    const { exchanges, queues } = this.app.config.rabbitmq.client;
    const exchange = exchanges[exchangeName].name;
    const queue = queues[queueName].name;
    const routingKeys = queues[queueName].keys;
    const channel = this.app.rabbitmq;
    return { channel, exchange, queue, routingKeys };
  }

  getExchangeInfo(exchangeName) {
    const { exchanges, queues } = this.app.config.rabbitmq.client;
    const exchange = exchanges[exchangeName].name;
    const channel = this.app.rabbitmq;
    return { channel, exchange };
  }

  /**
   * 发布消息到队列
   * @param channel
   * @param exchange
   * @param key
   * @param data
   */
  private sendToExchange(channel, exchange, key, data, opts = {}): boolean {
    const message = {
      exchange,
      key,
      message: data,
      options: {
        priority: 10,
        persistent: true,
        mandatory: true,
        ...opts,
      },
    };
    return channel.publish(message);
  }

  /**
   * 获取消息的交换机和队列信息
   */
  public getMessageQueueInfo() {
    return this.getQueueInfo('messageExchange', 'messageQueue');
  }

  /**
   * 获取消息回调结果的交换机和队列信息
   */
  public getMessageCallbackQueueInfo() {
    return this.getExchangeInfo('messageCallbackExchange');
  }

  /**
   * 获取失败消息的交换机和队列信息
   */
  public getFailedMessageQueueInfo() {
    return this.getQueueInfo('dlxMessageExchange', 'dlxMessageQueue');
  }

  /**
   * 获取延迟消息的交换机和队列信息
   */
  public getDelayMessageQueueInfo() {
    return this.getQueueInfo('delayMessageExchange', 'delayMessageQueue');
  }

  /**
   * 获取延迟消息的死信交换机和队列信息
   */
  public getDlxDelayMessageQueueInfo() {
    return this.getQueueInfo('dlxDelayMessageExchange', 'dlxDelayMessageQueue');
  }

  /**
   * 发布消息到message_queue
   * @param data
   */
  public sendToMessageQueue(data: object): boolean {
    const { channel, exchange, routingKeys } = this.getMessageQueueInfo();
    return this.sendToExchange(channel, exchange, routingKeys.wechatTemplateMessage, data);
  }

  /**
   * 发布消息到delay_message_queue
   * @param data
   * @param expiration  过期时间（毫秒）
   */
  public sendToDelayMessageQueue(data: object, expiration: number): boolean {
    const { channel, exchange, routingKeys } = this.getDelayMessageQueueInfo();
    return this.sendToExchange(channel, exchange, routingKeys.wechatTemplateMessage, data, { expiration });
  }

  /**
   * 发布消息到message_callback_queue
   * @param data
   */
  public sendToMessageCallbackQueue(data: object): boolean {
    const { channel, exchange } = this.getMessageCallbackQueueInfo();
    return this.sendToExchange(channel, exchange, '', data);
  }
}
