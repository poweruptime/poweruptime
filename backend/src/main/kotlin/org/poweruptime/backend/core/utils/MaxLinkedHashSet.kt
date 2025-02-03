package org.poweruptime.backend.core.utils

class MaxLinkedHashSet<E>(val maxSize: Int) : LinkedHashSet<E>() {
    init {
        require(maxSize > 0) { "Max size must be greater than 0" }
    }

    override fun add(element: E): Boolean {
        val added = super.add(element)
        if (size > maxSize) {
            val iterator = iterator()
            iterator.next()
            iterator.remove()
        }
        return added
    }

    override fun addAll(elements: Collection<E>): Boolean {
        val added = super.addAll(elements)
        if (size > maxSize) {
            val iterator = iterator()
            repeat(size - maxSize) {
                iterator.next()
                iterator.remove()
            }
        }
        return added
    }
}
