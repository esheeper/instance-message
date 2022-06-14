/*
 Navicat Premium Data Transfer

 Source Server         : root
 Source Server Type    : MySQL
 Source Server Version : 80026
 Source Host           : localhost:3306
 Source Schema         : huorunrun

 Target Server Type    : MySQL
 Target Server Version : 80026
 File Encoding         : 65001

 Date: 14/06/2022 15:24:46
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for message
-- ----------------------------
DROP TABLE IF EXISTS `message`;
CREATE TABLE `message`  (
  `id` bigint unsigned NOT NULL COMMENT '消息的主键，可以根据比较主键来拉取缓存的历史消息',
  `from` bigint unsigned NOT NULL COMMENT '谁发的消息',
  `to` bigint unsigned NOT NULL COMMENT '发给谁的消息',
  `type` char(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '字符t代表文本，i代表图片',
  `msg` varchar(1023) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '消息内容，不允许发送太长的消息',
  `send` bit(1) NOT NULL DEFAULT b'0' COMMENT '这条消息是否已经发送了',
  `timestamp` timestamp(0) NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP(0) COMMENT '保存信息的时间戳',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `from`(`from`) USING BTREE,
  INDEX `to`(`to`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 64 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

SET FOREIGN_KEY_CHECKS = 1;
ALTER table message modify id bigint unsigned auto_increment;
