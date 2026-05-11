package com.commutepool

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.scheduling.annotation.EnableScheduling

@SpringBootApplication
@EnableScheduling
class CommutePoolApplication

fun main(args: Array<String>) {
    runApplication<CommutePoolApplication>(*args)
}
