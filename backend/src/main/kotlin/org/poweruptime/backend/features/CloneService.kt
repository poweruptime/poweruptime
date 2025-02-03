package org.poweruptime.backend.features

// @Service
// class CloneService(
//    private val eventService: EventService,
//    private val printerService: PrinterService,
//    private val productGroupService: ProductGroupService,
//    private val productService: ProductService,
//    private val tableGroupService: TableGroupService,
//    private val tableService: TableService,
//    private val unpaidReasonService: BillUnpaidReasonService,
// ) {
//    @Transactional
//    fun cloneEvent(eventOrLocation: EventOrLocation): EventOrLocation {
//        val copyEvent = eventService.save(eventOrLocation.clone(eventService.generateUniqueRandomWaiterCreateToken()))
//
//        val copyPrintersWithOldId =
//            eventOrLocation.printers.associateBy { it.id }.mapValues { (_, v) ->
//                printerService.save(
//                    v.clone(copyEvent)
//                )
//            }
//
//        val copyProductGroupsWithOldId =
//            eventOrLocation.productGroups.associateBy { it.id }.mapValues { (_, v) ->
//                productGroupService.save(
//                    v.clone(copyEvent)
//                )
//            }
//
//        val copyTableGroupsWithOldId =
//            eventOrLocation.tableGroups.associateBy { it.id }.mapValues { (_, v) ->
//                tableGroupService.save(
//                    v.clone(copyEvent)
//                )
//            }
//
//        eventOrLocation.productGroups.flatMap { it.products }.let { products ->
//            productService.saveAll(
//                products.map {
//                    it.clone(
//                        copyProductGroupsWithOldId[it.productGroup.id] ?: throw NotFoundException(),
//                        copyPrintersWithOldId[it.printer.id] ?: throw NotFoundException()
//                    )
//                }
//            )
//        }
//
//        eventOrLocation.tableGroups.flatMap { it.tables }.let { tables ->
//            tableService.saveAll(
//                tables.map {
//                    it.clone(
//                        tableService.generateUniqueRandomPublicId(),
//                        copyTableGroupsWithOldId[it.tableGroup.id] ?: throw NotFoundException(),
//                    )
//                }
//            )
//        }
//
//        unpaidReasonService.saveAll(
//            eventOrLocation.unpaidReasons.map {
//                it.clone(copyEvent)
//            }
//        )
//
//        return eventService.getByIdOrThrow(copyEvent.id)
//    }
// }
